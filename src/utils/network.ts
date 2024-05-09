import { NetworkId } from '../enums/network';
import { NetworkParams } from '../types/network';

export const hasEthereumInjected = () => !!window.ethereum;

export const getDefaultDecimalsForNetwork = (networkId: NetworkId) => {
    if (
        [
            NetworkId.Arbitrum,
            NetworkId.PolygonMainnet,
            NetworkId.Base,
            NetworkId.ZkSync,
            NetworkId.OptimismSepolia,
        ].includes(networkId)
    )
        return 6;
    return 18;
};

export const changeNetwork = async (
    network?: NetworkParams,
    callback?: VoidFunction,
    chainId?: string
): Promise<void> => {
    if (hasEthereumInjected()) {
        try {
            await (window.ethereum as any).request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network?.chainId || chainId }],
            });
            callback && callback();
        } catch (switchError: any) {
            if (network && switchError.code === 4902) {
                try {
                    await (window.ethereum as any).request({
                        method: 'wallet_addEthereumChain',
                        params: [network],
                    });
                    await (window.ethereum as any).request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: network.chainId }],
                    });
                    callback && callback();
                } catch (addError) {
                    console.log(addError);
                }
            } else {
                console.log(switchError);
            }
        }
    } else {
        callback && callback();
    }
};
