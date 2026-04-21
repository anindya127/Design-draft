package store

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"io"
)

// fieldEncryptor handles AES-256-GCM encryption for user PII fields.
// The key is derived from a master secret using PBKDF2-SHA256.
type fieldEncryptor struct {
	key []byte // 32 bytes (AES-256)
}

const (
	encryptionSaltHex = "6763737362616365" // "gcssbase" in hex — fixed salt for key derivation
	encryptionIters   = 100000
	encryptionKeyLen  = 32 // AES-256
)

// newFieldEncryptor derives an AES-256 key from the master secret via PBKDF2-SHA256.
func newFieldEncryptor(secret string) *fieldEncryptor {
	if secret == "" {
		return nil // encryption disabled
	}
	salt, _ := hex.DecodeString(encryptionSaltHex)
	key := pbkdf2Sha256([]byte(secret), salt, encryptionIters, encryptionKeyLen)
	return &fieldEncryptor{key: key}
}

// Encrypt encrypts plaintext using AES-256-GCM. Returns base64-encoded "nonce:ciphertext".
// If encryptor is nil or plaintext is empty, returns plaintext unchanged.
func (fe *fieldEncryptor) Encrypt(plaintext string) string {
	if fe == nil || plaintext == "" {
		return plaintext
	}

	block, err := aes.NewCipher(fe.key)
	if err != nil {
		return plaintext // fallback: don't corrupt data
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return plaintext
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return plaintext
	}

	ciphertext := gcm.Seal(nil, nonce, []byte(plaintext), nil)

	// Format: "enc:" + base64(nonce + ciphertext)
	combined := append(nonce, ciphertext...)
	return "enc:" + base64.RawURLEncoding.EncodeToString(combined)
}

// Decrypt decrypts an "enc:"-prefixed string. If the string is not encrypted
// (no "enc:" prefix), returns it as-is (backward compat with unencrypted data).
func (fe *fieldEncryptor) Decrypt(data string) string {
	if fe == nil || data == "" {
		return data
	}

	// Not encrypted — return as-is (backward compat)
	if len(data) < 4 || data[:4] != "enc:" {
		return data
	}

	combined, err := base64.RawURLEncoding.DecodeString(data[4:])
	if err != nil {
		return data
	}

	block, err := aes.NewCipher(fe.key)
	if err != nil {
		return data
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return data
	}

	nonceSize := gcm.NonceSize()
	if len(combined) < nonceSize {
		return data
	}

	nonce := combined[:nonceSize]
	ciphertext := combined[nonceSize:]

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return data // can't decrypt — return raw (migration case)
	}
	return string(plaintext)
}

// HashForLookup creates a deterministic SHA-256 hash of a value for indexed lookups.
// Used for email so we can find users by email without decrypting every row.
func (fe *fieldEncryptor) HashForLookup(value string) string {
	if value == "" {
		return ""
	}
	mac := hmac.New(sha256.New, fe.key)
	mac.Write([]byte(value))
	return hex.EncodeToString(mac.Sum(nil))
}

// IsEnabled returns true if encryption is configured.
func (fe *fieldEncryptor) IsEnabled() bool {
	return fe != nil && len(fe.key) > 0
}

var errEncryptionRequired = errors.New("ENCRYPTION_SECRET is required for production")
