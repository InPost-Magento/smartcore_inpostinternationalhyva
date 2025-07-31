<?php
declare(strict_types=1);

namespace Smartcore\InPostInternationalHyva\ViewModel;

use Magento\Backend\Model\UrlInterface;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Config\Model\ResourceModel\Config;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Encryption\EncryptorInterface;
use Magento\Framework\FlagManager;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\Store\Model\StoreManagerInterface;
use Smartcore\InPostInternational\Model\ConfigProvider;
use Psr\Log\LoggerInterface;
use Smartcore\InPostInternational\Service\Logo;

final class ConfigProviderWrapper extends ConfigProvider implements ArgumentInterface
{
    public function __construct(
        private readonly ScopeConfigInterface            $scopeConfig,
        private readonly UrlInterface                    $adminUrl,
        private readonly EncryptorInterface              $encryptor,
        private readonly Config                          $_resourceConfig,
        private readonly StoreManagerInterface           $storeManager,
        private readonly FlagManager                     $flagManager,
        private readonly RequestInterface                $request,
        private readonly LoggerInterface                 $logger,
        private readonly \Magento\Framework\UrlInterface $urlBuilder,
        private CheckoutSession                          $checkoutSession,
        private readonly Logo                            $logo,
        private readonly array                           $couriers = []
    ) {
        parent::__construct(
            $scopeConfig,
            $adminUrl,
            $encryptor,
            $_resourceConfig,
            $storeManager,
            $flagManager,
            $request,
            $logger,
            $urlBuilder,
            $checkoutSession,
            $logo,
            $couriers
        );
    }

    public function getConfig(): array
    {
        try {
            $result = parent::getConfig()['inpostGeowidget'];
            list($scope, $scopeId) = $this->getCurrentScope();
            $hyvaConfig = $this->scopeConfig->getValue(
                self::SHIPPING_CONFIG_PATH . 'hyva',
                $scope,
                $scopeId
            );
            foreach($hyvaConfig as $key => $value) {
                $result[$key] = $value;
            }

            return $result;
        } catch (\Exception $e) {
            $this->logger->error('InPost config error: ' . $e->getMessage());
            return [];
        }
    }

    public function camelToKebab(string $string): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $string));
    }
}
