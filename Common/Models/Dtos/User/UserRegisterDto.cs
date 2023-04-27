using DataAccess.Enums;

namespace Shared.Dtos
{
    public class UserLoginDto
    {
        public string Email { get; set; }

        public string Password { get; set; }

        public AuthType AuthType { get; set; }
    }
}
