namespace MongoDbConnector.Records;

internal class TestRecord : IDbRecord
{
    public ObjectId Id { get; set; }
    public string Value { get; set; }
    public bool IsValid => true;
    public string Key => Id.ToString();
}
