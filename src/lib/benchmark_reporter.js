function benchmarkReporter(suite) {
  var table = document.createElement('table');

  function renderBenchmarkCol(parent, elemName, innerHTML) {
    var elem = document.createElement(elemName);
    elem.innerHTML = innerHTML;
    parent.appendChild(elem);
  }

  function renderBenchmark() {
    while (table.hasChildNodes()) {
      table.removeChild(table.lastChild);
    }

    var tr, txt;

    tr = document.createElement('tr');
    renderBenchmarkCol(tr, "th", "Test");
    renderBenchmarkCol(tr, "th", "Ops/sec");
    table.appendChild(tr);

    for (var i = 0, ilen = suite.length; i < ilen; i++) {
      var bench = suite[i];
      tr = document.createElement('tr');
      renderBenchmarkCol(tr, "td", bench.name);

      if (bench.running) {
        txt = 'running&hellip;';
      }
      // status: completed
      else if (bench.hz) {
        // obscure details until the suite has completed
        txt = '<span title="Ran ' + Benchmark.formatNumber(bench.count) + ' times in ' +
          bench.times.cycle.toFixed(3) + ' seconds.">' + Benchmark.formatNumber(bench.hz.toFixed(bench.hz < 100 ? 2 : 0)) +
          ' <small>&plusmn;' + bench.stats.rme.toFixed(2) + '%</small>' + '</span>';
      }
      else {
        txt = "ready";
      }

      renderBenchmarkCol(tr, "td", txt);
      table.appendChild(tr);
    }
  }

  window.addEventListener("load", function () {
    var button = document.createElement('button');
    button.innerHTML = "Run benchmark";
    button.addEventListener("click", function () {
      suite.run();
    });
    document.body.appendChild(button);

    var p = document.createElement('p');
    p.innerHTML = Benchmark.platform.toString();
    document.body.appendChild(p);

    table.id = "test_results";
    document.body.appendChild(table);

    renderBenchmark();
  });

  suite.on('cycle', function (event) {
    //renderBenchmark();
  });
  suite.on('complete', function () {
    renderBenchmark();
  });
}