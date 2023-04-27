using DataAccess.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Dtos
{
    public class UserDto
    {
        public int Id { get; set; }

        public string UserName { get; set; }

        public string EmailAddress { get; set; }

        public UserPermission UserPermission { get; set; }

        public int? HouseholdId { get; set; }

        public string ActivateLink { get; set; }
    }
}
