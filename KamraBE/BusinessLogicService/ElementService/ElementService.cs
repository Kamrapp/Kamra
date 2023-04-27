using BusinessLogicService.ElementService;

using DataAccess.Data;

using Microsoft.EntityFrameworkCore;

namespace BusinessLogicService.UserService
{
    public class ElementService : IElementService
    {
        private readonly ApplicationDbContext _context;
        public ElementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ElementDto> GetElement(ElementDto elementDto)
        {
            try
            {
                var element = await _context.Elements.FirstOrDefaultAsync(x => x.Id == elementDto.Id);
                // todo if not exists throw an error
                if (element == null) return null;

                return element?.ToDto();
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

        public async Task<IEnumerable<ElementDto>> GetAllElements()
        {
            try
            {
                var elementDtos = _context.Elements.Select(x => x.ToDto()).ToList();
                return elementDtos;
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

        public async Task<bool> CreateElement(ElementDto elementDto)
        {
            try
            {
                var elementAlreadyExists = await _context.Elements.AnyAsync(x => x.Id == elementDto.Id);

                //TODO: fix handling existence
                if (elementAlreadyExists)
                    throw new InvalidDataException("Element to be created already exists");

                var newElement = elementDto.ToModel();

                _context.Elements.Add(newElement);

                var result = await _context.SaveChangesAsync();

                return result > 0;
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
