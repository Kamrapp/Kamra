namespace Fetcher;
class Program
{
    static async Task Main()
    {
        var fetcher = new Instance.Fetcher();

        await fetcher.Fetch();
    }
}
