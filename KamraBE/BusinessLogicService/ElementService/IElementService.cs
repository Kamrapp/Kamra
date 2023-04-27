namespace BusinessLogicService.ElementService
{
    public interface IElementService
    {
        public Task<MongoElementDto> GetElement(string mongoId);
        public Task<MongoElementDto> GetElement(int id);
        public Task<IEnumerable<MongoElementDto>> GetAllElements();
        public Task<MongoElementDto> CreateElement(MongoElementDto elementDto);

    }
}
