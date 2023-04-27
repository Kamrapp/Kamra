using BusinessLogicService.EmailService;
using BusinessLogicService.UserService;

using DataAccess.Enums;

using KamraAPI.External;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Shared.Dtos;
using Shared.Utils;

namespace KamraAPI.Controllers
{
    [ApiController]
    [Route("api/user/")]
    public class UserController : Controller
    {
        private readonly IUserService _userService;
        private readonly IEmailService _emailService;

        public UserController(IUserService userService, IEmailService emailService)
        {
            _userService = userService;
            _emailService = emailService;
        }

        [AllowAnonymous]
        [HttpPost]
        [Route(nameof(Login))]
        public async Task<IActionResult> Login([FromBody] UserLoginDto userLoginDto)
        {
            try
            {
                var user = await _userService.GetUserCommon(userLoginDto.Email, Hash.GetHashedString(userLoginDto.Password));
                var token = _userService.GenerateToken(user);

                return Ok(token);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost]
        [Route(nameof(Regist))]
        public async Task<IActionResult> Regist([FromBody] UserRegisterDto userRegisterDto)
        {
            try
            {
                var existsValidation = await _userService.GetUserGoogle(userRegisterDto.Email);
                if (existsValidation != null)
                    return Conflict();

                var user = await _userService.RegisterUser(userRegisterDto);
                if (user != null)
                    _emailService.SendVerifyMail(user, userRegisterDto.Lang);

                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost]
        [Route(nameof(Verify))]
        public async Task<IActionResult> Verify(string addr, string token)
        {
            try
            {
                var verify = await _userService.VerifyUser(addr, token);
                if (verify)
                    return Ok();
                else
                    return BadRequest();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [RolesAuthorize(UserPermission.User)]
        [HttpGet]
        [Route(nameof(UserTest))]
        public IActionResult UserTest()
        {
            return Ok("UserTest: Works!");
        }

        [RolesAuthorize(UserPermission.SA)]
        [HttpGet]
        [Route(nameof(SATest))]
        public IActionResult SATest()
        {
            return Ok("SA: Works!");
        }
    }
}
