using BusinessLogicService.ElementService;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using MongoDB.Bson;

using Shared.Dtos;

namespace KamraAPI.Controllers
{
    [ApiController]
    [Route("api/element/")]
    public class ElementController : Controller
    {
        private readonly IElementService _elementService;

        public ElementController(IElementService elementService)
        {
            _elementService = elementService;
        }

        [AllowAnonymous]
        [HttpPost]
        [Route(nameof(Create))]
        public async Task<IActionResult> Create([FromBody] MongoElementDto elementDto)
        {
            try
            {
                var element = await _elementService.CreateElement(elementDto);

                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost]
        [Route(nameof(Get))]
        public async Task<IActionResult> Get([FromBody] ObjectId mongoId)
        {
            try
            {
                var element = await _elementService.GetElement(mongoId);

                return Ok(element);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpGet]
        [Route(nameof(GetAll))]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var elements = await _elementService.GetAllElements();

                return Ok(elements);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
