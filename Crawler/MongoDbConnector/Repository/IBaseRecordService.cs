namespace MongoDbConnector.Repository;

public interface IBaseRecordService<TKeyRecord> : IKeyRecordService<TKeyRecord>
    where TKeyRecord : BaseRecord
{
}
