global using System;
global using System.Collections.Generic;
global using System.IO;
global using System.Linq;
global using System.Threading.Tasks;

global using Shared.Attributes.ClassAttributes;
global using Shared.Attributes.Enums;
global using Shared.Attributes.PropertyAttributes;
global using Shared.Extensions;
global using Shared.Utils;

global using Crawler.Read;
global using Crawler.Download;
global using Crawler.Process;
global using Crawler.Pipeline;
global using Crawler.Schedule;
global using Crawler.Helpers;

global using HtmlAgilityPack;
global using Microsoft.Playwright;
global using MongoDB.Bson;
global using MongoDbConnector.Repository;