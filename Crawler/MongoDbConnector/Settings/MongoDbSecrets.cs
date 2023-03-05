namespace MongoDbConnector.Settings;
public class MongoDbSecrets
{
    public string Password { get; set; }
    public string Username { get; set; }
    public string Cluster { get; set; }
    public string ClusterLocation { get; set; }
    public string DatabaseName { get; set; }
    public string CollectionName { get; set; }

    public string ConnectionData => $"{Username}:{Password}@{Cluster}.{ClusterLocation}";
}
