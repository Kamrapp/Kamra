namespace Crawler.Download
{
    /// <summary>
    /// Type of the downloaders when crawler download source web
    /// </summary>
    public enum DownloaderType
    {
        /// <summary>
        /// Download to local file
        /// </summary>
        FromFile,
        /// <summary>
        /// Without downloading to local file, download temp and directly use
        /// </summary>
        FromMemory,
        /// <summary>
        /// Read direct from web
        /// </summary>
        FromWeb
    }
}
