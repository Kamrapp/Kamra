using MongoDB.Bson;

namespace BusinessLogicService.ElementService
{
    public interface IElementService
    {
        public Task<MongoElementDto> GetElement(ObjectId mongoId);
        public Task<IEnumerable<MongoElementDto>> GetAllElements();
        public Task<MongoElementDto> CreateElement(MongoElementDto elementDto);

    }
}
