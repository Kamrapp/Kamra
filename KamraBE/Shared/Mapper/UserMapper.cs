using DataAccess.Models;
using DataAccess.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Shared.Dtos;

namespace Shared.Mapper
{
    public static class UserMapper
    {
        public static UserDto ToDto(this User user)
        {
            if (user == null)
                return null;

            return new UserDto()
            {
                Id = user.Id,
                UserName = user.UserName,
                EmailAddress = user.EmailAddress,
                UserPermission = user.UserPermission,
                HouseholdId = user.HouseHoldId,
                ActivateLink = user.ActivateLink
            };
        }

        public static User ToModel(this UserRegisterDto userRegisterDto)
        {
            return new User()
            {
                UserName = String.Empty,
                Password = userRegisterDto.Password,
                EmailAddress = userRegisterDto.Email,
                CreatedDate = DateTime.Now,
                AuthType = userRegisterDto.AuthType,
                Activated = false,
                ActivateLink = Guid.NewGuid().ToString(),
                UserPermission = UserPermission.User
            };
        }
    }
}
