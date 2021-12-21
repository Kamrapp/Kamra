using System.Text;

namespace Kamrapp.Helpers
{
    public class MathHelper
    {
        public static string GenerateRandomString(int length)
        {
            if (length <= 0) return string.Empty;

            StringBuilder str_build = new StringBuilder();
            Random random = new Random();

            for (int i = 0; i < length; i++)
            {
                double flt = random.NextDouble();
                int shift = Convert.ToInt32(Math.Floor(25 * flt));
                char letter = Convert.ToChar(shift + 65);
                str_build.Append(letter);
            }

            return str_build.ToString();
        }
    }
}