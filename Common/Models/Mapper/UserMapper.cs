using DataAccess.Enums;

using Models.Entities;

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
                // MVP-59: todo make the verification email usable (the api works! only a page should be essential and proper testing credentials for smtp)
                //Activated = false,
                Activated = true,
                ActivateLink = Guid.NewGuid().ToString(),
                UserPermission = UserPermission.User
            };
        }
    }
}
