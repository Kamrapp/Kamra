using DataAccess.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos
{
    public class UserLoginDto
    {
        public string Email { get; set; }

        public string Password { get;set; }

        public AuthType AuthType { get; set; }
    }
}
