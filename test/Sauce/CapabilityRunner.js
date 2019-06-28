/**
 * SauceLabs Jasmine CapabilityRunner
 * CapabilityRunner.js 0.0.0
 * (c) 2017 Omar Alshaker, Marcin Warpechowski
 * MIT license
 */

const SauceLabs = require("saucelabs").default;
const webdriver = require("selenium-webdriver");
const Promise = require("bluebird");
const retryUntil = require("bluebird-retry");

function CapabilityRunner(caps) {
  return new Promise(function(resolve, reject) {
    console.log("");
    console.log(caps.name);

    const username = caps.username;
    const accessKey = caps.accessKey;

    const saucelabs = new SauceLabs({
      username: username,
      password: accessKey
    });

    const By = webdriver.By;

    let driver = new webdriver.Builder()
      .withCapabilities(caps)
      .usingServer(
        "http://" + username + ":" + accessKey + "@localhost:4445/wd/hub"
      )
      .build();

    driver.get(
      "http://localhost:5000/test/index.html"
    );

    const symbols = { passed: "√", pending: "-", failed: "x" };

    function checkIfDone() {
      return new Promise(function(resolve, reject) {
        driver
          .executeScript("return window.jsApiReporter && window.jsApiReporter.finished && window.jsApiReporter.specs();")
          .then(function(results) {
            if (results) {
              resolve(results);
            } else {
              reject();
            }
          });
      });
    }
    /* get session ID and keep checking if tests are finished */
    driver.getSession().then(sessionID => {
      /*set driver ID to end session later */
      driver.sessionID = sessionID.id_;
      retryUntil(checkIfDone, { interval: 15000 }).then(testResults => {
        console.log("Specs finished");
        analyzeResults(testResults);
      }).catch(error => {
        console.log(`${caps.name}: ${error}`);
        process.exit(1);
      });
    });

    async function analyzeResults(results) {
      const resultsSummary = { passed: 0, pending: 0, failed: 0 };
      var hadErrored = 0;
      results.forEach(spec => {
        resultsSummary[spec.status]++;
        console.log(
          "   " + symbols[spec.status] + " " + spec.fullName
        );
        if (spec.status === "failed") {
          hadErrored = 1;
          console.log(`Spec "${spec.fullName}" failed, the error was`, spec.failedExpectations);
        }
      });
      console.log("");
      console.log(
        ("Summary for (" + caps.name + ")")
      );
      console.log(resultsSummary);
      console.log("");
      console.log("Ending session: " + driver.sessionID);

      const result = {
        name: "Summary: Passed: " +
          resultsSummary.passed +
          ", pending: " +
          resultsSummary.pending +
          ", failed: " +
          resultsSummary.failed,
        passed: hadErrored === 0
      };

      driver.quit();

      await saucelabs.updateJob(username, driver.sessionID, result);
      resolve();
    }
  });
}

module.exports = CapabilityRunner;
