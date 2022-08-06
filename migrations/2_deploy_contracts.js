const NFTViewer = artifacts.require("NFTViewer");
const MailERC721 = artifacts.require("MailERC721");
const IPFSServerERC721 = artifacts.require("IPFSServerERC721");
const MailERC721Attack_1 = artifacts.require("MailERC721Attack_1");
const MailERC721Attack_2 = artifacts.require("MailERC721Attack_2");
const IPFSServerERC721Attack_1 = artifacts.require("IPFSServerERC721Attack_1");
const IPFSServerERC721Attack_2 = artifacts.require("IPFSServerERC721Attack_2");
const IPFSServerERC721Attack_3 = artifacts.require("IPFSServerERC721Attack_3");

module.exports = function(deployer) {
    deployer.then(async () => {
        await deployer.deploy(NFTViewer);
        await deployer.deploy(MailERC721);
        await deployer.deploy(IPFSServerERC721);
        await deployer.deploy(MailERC721Attack_1, MailERC721.address);
        await deployer.deploy(MailERC721Attack_2, MailERC721.address);
        await deployer.deploy(IPFSServerERC721Attack_1, IPFSServerERC721.address);
        await deployer.deploy(IPFSServerERC721Attack_2, IPFSServerERC721.address);
        await deployer.deploy(IPFSServerERC721Attack_3, IPFSServerERC721.address);
    });
};