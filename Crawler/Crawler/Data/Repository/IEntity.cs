namespace Crawler.Data.Repository
{
    public interface IEntity
    {
        int Id { get; }
        public bool IsValid { get; }
    }
}
