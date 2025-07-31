# InPost InternationalHyva for Magento 2 and Hyva Checkout

## Overview
Module to integrate InPost International shipping services with Magento 2 and Hyva Checkout. It allows merchants to offer international shipping options through InPost, including pickup points selection via Geowidget.
It requires the `smartcore/inpostinternational` module to be installed first.

## Requirements
- Magento 2.4.x
- PHP >= 8.1 < 8.3
- Smartcore/InPostInternational module installed

## Installation

### Using Composer (recommended)
```bash
composer require smartcore/inpostinternationalhyva
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy
```

### Manual Installation
1. Create directory `app/code/Smartcore/InPostInternationalHyva`
2. Download and extract module files to that directory
3. Run Magento installation commands:
```bash
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy
```

## Configuration
Basic configuration steps:
1. Ensure that backend validation is enabled in the InPost International module configuration.

## Support
If you encounter any issues or need assistance:
- Check the detailed documentation in the `docs` folder
- Contact InPost International support
- Create an issue in the module's repository

## Security
If you discover any security related issues, please contact the InPost International team directly instead of using the issue tracker.

## Author
- Developed by Smartcore for InPost

## Release Notes
See [CHANGELOG.md](docs/CHANGELOG.md) for all version changes.

## Additional Resources
- [InPost International API Documentation](https://developers.inpost-group.com/)
- [InPost International Geowidget Documentation](https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/481755145/Geowidget+International)
- [Module Documentation [PL]](docs/PL/DOCUMENTATION.md)
