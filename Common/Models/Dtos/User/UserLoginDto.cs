using DataAccess.Enums;

namespace Shared.Dtos
{
    public class UserRegisterDto
    {
        public string Email { get; set; }

        public string Password { get; set; }

        public AuthType AuthType { get; set; }

        public string Lang { get; set; }

    }
}
