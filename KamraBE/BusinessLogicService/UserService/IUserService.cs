namespace BusinessLogicService.UserService
{
    public interface IUserService
    {
        public Task<UserDto> RegisterUser(UserRegisterDto userRegisterDto);
        public Task<UserDto> GetUserCommon(string email, string password);
        public Task<UserDto> GetUserGoogle(string email);
        public Task<bool> VerifyUser(string addr, string token);
        public string GenerateToken(UserDto user);
    }
}
