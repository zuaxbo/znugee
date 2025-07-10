using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Cors;

namespace UserAuthAPI.Controllers
{
    [EnableCors(origins: "*", headers: "*", methods: "*")]
    [RoutePrefix("api/test")]
    public class TestController : ApiController
    {
        // GET: api/test/ping
        [HttpGet]
        [Route("ping")]
        public IHttpActionResult Ping()
        {
            try
            {
                return Ok(new
                {
                    Success = true,
                    Message = "UserAuthAPI is running",
                    Service = "UserAuthAPI",
                    Port = 49305,
                    Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    Version = "1.0.0"
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    Success = false,
                    Message = "Service error: " + ex.Message,
                    Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
        }

        // GET: api/test/status
        [HttpGet]
        [Route("status")]
        public IHttpActionResult GetStatus()
        {
            try
            {
                return Ok(new
                {
                    Success = true,
                    Message = "Service is healthy",
                    Services = new
                    {
                        Database = CheckDatabaseConnection(),
                        Session = System.Web.HttpContext.Current?.Session != null,
                        Memory = GC.GetTotalMemory(false)
                    },
                    Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    Success = false,
                    Message = "Health check failed: " + ex.Message,
                    Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
        }

        private bool CheckDatabaseConnection()
        {
            try
            {
                using (var context = new UserAuthAPI.Data.ApplicationDbContext())
                {
                    return context.Database.Exists();
                }
            }
            catch
            {
                return false;
            }
        }
    }
}