'use strict'

const googleapis = require('googleapis')
const google = require('googleapis')
const compute = google.compute('v1')

function auth(callback) {
  google.auth.getApplicationDefault(function (err, authClient) {
    if (err) {
      return callback(err);
    }
    // The createScopedRequired method returns true when running on GAE or a
    // local developer machine. In that case, the desired scopes must be passed
    // in manually. When the code is  running in GCE or a Managed VM, the scopes
    // are pulled from the GCE metadata server.
    // See https://cloud.google.com/compute/docs/authentication for more
    // information.
    if (authClient.createScopedRequired && authClient.createScopedRequired()) {
      // Scopes can be specified either as an array or as a single,
      // space-delimited string.
      authClient = authClient.createScoped([
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/compute',
        'https://www.googleapis.com/auth/compute.readonly'
      ]);
    }
    callback(null, authClient);
  });
}

function getVMS(callback) {
  auth(function (err, authClient) {
    if (err) {
      return callback(err);
    }
    // Retrieve the vms
    compute.instances.aggregatedList({
      auth: authClient,
      zone: "https://www.googleapis.com/compute/v1/projects/mcc-2016-g10-p1/zones/europe-west1-d",
      project: process.env.GCLOUD_PROJECT,
      // In this example we only want one VM per page
      maxResults: 100
    }, function (err, vms) {
      if (err) {
        return callback(err);
      }

      callback(null, vms);
    });
  });
}

function powerOffVM(ist, off, callback) {
  const instance = ist || ''
  if (instance != '') {
    auth((err, client) => {
      if (err) { return next(err) }
      const options = {
        project: process.env.GCLOUD_PROJECT,
        instance: instance,
        zone: 'europe-west1-d',
        auth: client
      }

      function completion(err, result) {
        if (err) {
          callback(err)
        } else {
          callback(null, result)
        }
      }

      if (off) {
        compute.instances.stop(options, completion)
      } else {
        compute.instances.start(options, completion)
      }

    })
  } else {
    callback(new Error('Invalid instance name'))
  }
}

module.exports = { getVMS, powerOffVM }