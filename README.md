# Notice: Repository Deprecation
This repository is deprecated and no longer actively maintained. It contains outdated code examples or practices that do not align with current MongoDB best practices. While the repository remains accessible for reference purposes, we strongly discourage its use in production environments.
Users should be aware that this repository will not receive any further updates, bug fixes, or security patches. This code may expose you to security vulnerabilities, compatibility issues with current MongoDB versions, and potential performance problems. Any implementation based on this repository is at the user's own risk.
For up-to-date resources, please refer to the [MongoDB Developer Center](https://mongodb.com/developer).

# Visualize MongoDB Atlas Database Audit Logs using Atlas App Services, Atlas Data Federation and Atlas Charts

In this repository, you can find the complementary utilities that was explained in the following blog post: MongoDB Developer Blog Post: ....

- `atlas_functions/` folder includes one Atlas Function that retrieves compressed audit logs and uploads into S3 bucket.
- `chart_export/` folder includes an exported Atlas Charts dashboard that can be imported into your own Atlas Charts and you can use the charts after you've configured the data source properly.
- `data_generator/` folder includes a data generator that makes fake operations on the collections `customers` and `orders` in the database name `audit_logs`

