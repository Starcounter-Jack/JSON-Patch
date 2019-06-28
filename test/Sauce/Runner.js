const CapabilityRunner = require("./CapabilityRunner");
const sauceConnectLauncher = require('sauce-connect-launcher');

const username = process.env.SAUCE_USERNAME; //JSON-Patch repo uses "json-patch" user which is a subaccount of the Starcounter SauceLabs account
const accessKey = process.env.SAUCE_ACCESS_KEY;

const tunnelIdentifier = "tunnel" + (process.env.TRAVIS_JOB_NUMBER || "-local");

if (!username) {
  console.error(
    "You need Sauce Labs access to run these specs, if you're a Palindrom org member, please contact @alshakero for this information, if not you need to add your own SauceLabs auth info to your system environment variables."
  );
  process.exit(1);

} else {
  const allCaps = [
    {
      browserName: "chrome",
      platform: "Windows 10",
      username: username,
      accessKey: accessKey,
      name: "Chrome: Running tests",
      "tunnel-identifier": tunnelIdentifier
    },
    {
      browserName: "firefox",
      platform: "Windows 10",
      username: username,
      accessKey: accessKey,
      name: "Firefox: Running tests",
      "tunnel-identifier": tunnelIdentifier
    },
    {
      browserName: "MicrosoftEdge",
      platform: "Windows 10",
      username: username,
      accessKey: accessKey,
      name: "MicrosoftEdge: Running tests",
      "tunnel-identifier": tunnelIdentifier
    }
  ];

  (async function() {
      try {
        console.log("Preparing Sauce Connect");
        sauceConnectLauncher({
            tunnelIdentifier
        }, async function (err, sauceConnectProcess) {
          if (err) {
            console.error(err.message);
            return;
          }
          console.log("Sauce Connect ready");

          await CapabilityRunner(allCaps[0]);
          await CapabilityRunner(allCaps[1]);
          await CapabilityRunner(allCaps[2]);

          sauceConnectProcess.close(function () {
            console.log("Closed Sauce Connect process");
            process.exit(0);
          })

          console.log('Done!');
        });

      } catch (error) {
          console.log(error);
          process.exit(1);
      }
  })();
}