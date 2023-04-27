using BusinessLogicService.ElementService;

using DataAccess.Data;

using Microsoft.EntityFrameworkCore;

using MongoDB.Bson;

namespace BusinessLogicService.UserService
{
    public class ElementService : IElementService
    {
        private readonly ApplicationDbContext _context;
        public ElementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MongoElementDto> GetElement(ObjectId mongoId)
        {
            try
            {
                var element = await _context.Elements.FirstOrDefaultAsync(x => x.MongoId == mongoId.ToString());
                // todo if not exists throw an error
                if (element == null) return null;

                return element?.ToMongoDto();
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

        public async Task<IEnumerable<MongoElementDto>> GetAllElements()
        {
            try
            {
                var elementDtos = _context.Elements.Select(x => x.ToMongoDto()).ToList();
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

        public async Task<MongoElementDto> CreateElement(MongoElementDto elementDto)
        {
            try
            {
                var elementAlreadyExists = await _context.Elements.AnyAsync(x => x.MongoId == elementDto.MongoId.ToString());

                //TODO: fix handling existence
                if (elementAlreadyExists)
                    throw new InvalidDataException("Element to be created already exists");

                var newElement = elementDto.ToModel();

                _context.Elements.Add(newElement);

                var result = await _context.SaveChangesAsync();

                return result > 0 ? newElement.ToMongoDto() : null;
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
    }
}
