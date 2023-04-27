namespace BusinessLogicService.ElementService
{
    public interface IElementService
    {
        public Task<ElementDto> GetElement(ElementDto elementDto);
        public Task<IEnumerable<ElementDto>> GetAllElements();
        public Task<bool> CreateElement(ElementDto elementDto);

    }
}
