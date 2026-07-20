using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace CRM_Inmobiliario.Api.Infrastructure.Security;

public interface IEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
}

public sealed class EncryptionService : IEncryptionService
{
    private const string VersionPrefix = "v1:";
    private const int NonceSize = 12; // AES-GCM recommended nonce size
    private const int TagSize = 16;   // AES-GCM standard tag size

    private readonly byte[] _key;

    public EncryptionService(string base64Key)
    {
        if (string.IsNullOrWhiteSpace(base64Key))
            throw new ArgumentException("Encryption key cannot be empty", nameof(base64Key));

        _key = Convert.FromBase64String(base64Key);
        
        if (_key.Length != 32) // AES-256 requires 32 bytes (256 bits)
            throw new ArgumentException($"Encryption key must be 32 bytes (256 bits). Provided key is {_key.Length} bytes.");
    }

    public string Encrypt(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext))
            return plaintext;

        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        
        using var aesGcm = new AesGcm(_key, TagSize);
        
        var nonce = new byte[NonceSize];
        RandomNumberGenerator.Fill(nonce);

        var ciphertextBytes = new byte[plaintextBytes.Length];
        var tag = new byte[TagSize];

        aesGcm.Encrypt(nonce, plaintextBytes, ciphertextBytes, tag);

        // Combine Nonce + Tag + Ciphertext
        var combined = new byte[NonceSize + TagSize + ciphertextBytes.Length];
        Buffer.BlockCopy(nonce, 0, combined, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, combined, NonceSize, TagSize);
        Buffer.BlockCopy(ciphertextBytes, 0, combined, NonceSize + TagSize, ciphertextBytes.Length);

        return $"{VersionPrefix}{Convert.ToBase64String(combined)}";
    }

    public string Decrypt(string ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext))
            return ciphertext;

        // Backward compatibility: If it doesn't have the prefix, return as is (plain text)
        if (!ciphertext.StartsWith(VersionPrefix))
            return ciphertext;

        try
        {
            var base64Data = ciphertext.Substring(VersionPrefix.Length);
            var combined = Convert.FromBase64String(base64Data);

            if (combined.Length < NonceSize + TagSize)
                throw new CryptographicException("Ciphertext is too short to be valid.");

            var nonce = new byte[NonceSize];
            var tag = new byte[TagSize];
            var ciphertextBytes = new byte[combined.Length - NonceSize - TagSize];

            Buffer.BlockCopy(combined, 0, nonce, 0, NonceSize);
            Buffer.BlockCopy(combined, NonceSize, tag, 0, TagSize);
            Buffer.BlockCopy(combined, NonceSize + TagSize, ciphertextBytes, 0, ciphertextBytes.Length);

            var plaintextBytes = new byte[ciphertextBytes.Length];

            using var aesGcm = new AesGcm(_key, TagSize);
            aesGcm.Decrypt(nonce, ciphertextBytes, tag, plaintextBytes);

            return Encoding.UTF8.GetString(plaintextBytes);
        }
        catch (FormatException)
        {
            // If the data after v1: is not valid Base64, we might be dealing with a corrupted string.
            // For safety, we just return the string as is to avoid breaking the application, 
            // though ideally this shouldn't happen.
            return ciphertext;
        }
        catch (CryptographicException)
        {
            // Tampered or corrupted data
            throw;
        }
    }
}
