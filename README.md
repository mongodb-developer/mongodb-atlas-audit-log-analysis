# Visualize MongoDB Atlas Database Audit Logs using Atlas App Services, Atlas Data Federation and Atlas Charts

In this repository, you can find the complementary utilities that was explained in the following blog post: MongoDB Developer Blog Post: ....

- `atlas_functions/` folder includes one Atlas Function that retrieves compressed audit logs and uploads into S3 bucket.
- `chart_export/` folder includes an exported Atlas Charts dashboard that can be imported into your own Atlas Charts and you can use the charts after you've configured the data source properly.
- `data_generator/` folder includes a data generator that makes fake operations on the collections `customers` and `orders` in the database name `audit_logs`

