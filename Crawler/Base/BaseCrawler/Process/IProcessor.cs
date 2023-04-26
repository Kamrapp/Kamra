namespace BaseCrawler.Process;

public interface IProcessor<TProduct, TOffer>
    where TProduct : BaseProduct
    where TOffer : BaseOffer
{
    (TProduct, TOffer) Process(HtmlDocument document, TProduct product, TOffer offer, bool isDiscount = false);
}
