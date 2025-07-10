using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
using System.Data.SqlClient;

namespace UserAuthAPI.Data
{
    public static class DbConnectionHelper
    {
        public static string GetConnectionString()
        {
            return ConfigurationManager.ConnectionStrings["DefaultConnection"]?.ConnectionString;
        }

        public static bool TestConnection()
        {
            try
            {
                var connectionString = GetConnectionString();
                if (string.IsNullOrEmpty(connectionString))
                    return false;

                using (var connection = new SqlConnection(connectionString))
                {
                    connection.Open();
                    return true;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Database connection test failed: " + ex.Message);
                return false;
            }
        }

        public static void ExecuteScript(string script)
        {
            try
            {
                var connectionString = GetConnectionString();
                if (string.IsNullOrEmpty(connectionString))
                    throw new InvalidOperationException("Connection string not found");

                using (var connection = new SqlConnection(connectionString))
                {
                    connection.Open();
                    using (var command = new SqlCommand(script, connection))
                    {
                        command.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Script execution failed: " + ex.Message);
                throw;
            }
        }
    }
}