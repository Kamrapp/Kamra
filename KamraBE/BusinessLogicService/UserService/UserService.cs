using Microsoft.IdentityModel.Tokens;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BusinessLogicService.UserService
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        private readonly IConfiguration _config;
        public UserService(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public string GenerateToken(UserDto user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credKey = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserName),
                new Claim(ClaimTypes.PrimaryGroupSid, user.HouseholdId.ToString()),
                new Claim(ClaimTypes.Email, user.EmailAddress),
                new Claim(ClaimTypes.Role, user.UserPermission.ToString()),
            };

            var token = new JwtSecurityToken(
                _config["Jwt:Issuer"],
                _config["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credKey);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<UserDto> GetUserCommon(string email, string password)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(x => x.EmailAddress == email && x.Password == password);
                // todo if not exists throw an error
                if (user == null) return null;

                // todo if not activated throw an error
                if (user.Activated == false) return null;

                return user?.ToDto();
            }
            catch (NullReferenceException ne)
            {
                // TODO logger
                return null;
            }
            catch (TimeoutException te)
            {
                return null;
            }
        }

        public async Task<UserDto> GetUserGoogle(string email)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(x => x.EmailAddress == email && x.AuthType == DataAccess.Enums.AuthType.Google);
                return user?.ToDto();
            }
            catch (NullReferenceException ne)
            {
                // TODO logger
                return null;
            }
            catch (TimeoutException te)
            {
                return null;
            }
        }

        public async Task<UserDto> RegisterUser(UserRegisterDto userRegisterDto)
        {
            try
            {
                var newUser = userRegisterDto.ToModel();
                if (newUser == null) return null;

                var userExists = await _context.Users.FirstOrDefaultAsync(x => x.EmailAddress == userRegisterDto.Email);
                // todo not activated error
                if (userExists?.Activated == false) return null;

                // todo exists error
                if (userExists != null) return null;


                newUser.Password = Hash.GetHashedString(userRegisterDto.Password);
                _context.Users.Add(newUser);

                var result = await _context.SaveChangesAsync();

                return result > 0 ? newUser.ToDto() : null;
            }
            catch (NullReferenceException ne)
            {
                return null;
            }
            catch (TimeoutException te)
            {
                return null;
            }
            catch (DbUpdateException dbex)
            {
                return null;
            }
        }

        public async Task<bool> VerifyUser(string addr, string token)
        {
            try
            {
                var newUser = await _context.Users.FirstOrDefaultAsync(x => x.EmailAddress == addr);
                if (newUser == null) return false;

                var tokenStored = Hash.GetHashedString(newUser.ActivateLink + newUser.EmailAddress);
                if (tokenStored != token) return false;

                newUser.Activated = true;

                return await _context.SaveChangesAsync() > 0;
            }
            catch (NullReferenceException ne)
            {
                return false;
            }
            catch (TimeoutException te)
            {
                return false;
            }
            catch (DbUpdateException dbex)
            {
                return false;
            }
        }
    }
}
