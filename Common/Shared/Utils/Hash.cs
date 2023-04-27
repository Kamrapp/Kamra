using System.Security.Cryptography;
using System.Text;

namespace Shared.Utils
{
    public class Hash
    {
        public static string GetHashedString(string pw)
        {
            string base64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(pw));
            using (SHA256 sha256Hash = SHA256.Create())
            {
                string hash = getHash(sha256Hash, base64);
                return hash;
            }
        }

        private static string getHash(HashAlgorithm hashAlgorithm, string input)
        {

            // Convert the input string to a byte array and compute the hash.
            byte[] data = hashAlgorithm.ComputeHash(Encoding.UTF8.GetBytes(input));

            // Create a new Stringbuilder to collect the bytes
            // and create a string.
            var sBuilder = new StringBuilder();

            // Loop through each byte of the hashed data
            // and format each one as a hexadecimal string.
            for (int i = 0; i < data.Length; i++)
            {
                sBuilder.Append(data[i].ToString("x2"));
            }

            // Return the hexadecimal string.
            return sBuilder.ToString();
        }
    }
}
