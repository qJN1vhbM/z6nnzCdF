function dat2html(dat, res = "") {
  let title = "";
  let thread = "";
  let delim = "："
  const re_datetime = new RegExp("[\\d/]+\\(.+\\) [\\d{2}:.]+");
  const re_id = new RegExp("ID:[\\w+/_\?]+");
  const re_anchor = new RegExp("<a href=\"\\.\\./test/read\\.cgi/(.+?)\".*?>", "gi");
  const re_url = new RegExp("h?(ttps?://[^ ]+)", "gi");
  const lines = dat.split("\n");
  let res_array = res_split(res, lines.length - 1);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = line.replace(re_anchor, "<a href=\"./#/$1\">");
    line = line.replace(re_url, "<a href=\"h$1\">h$1</a>");
    let x = line.split("<>");
    if (x.length < 5) {
      continue;
    }
    if (i == 0) {
      title = x[4];
    }
    
    let m;
    let date = x[2];
    if (m = x[2].match(re_datetime)) {
      date = m;
    }
    let id = "";
    if (m = x[2].match(re_id)) {
      id = m;
    }
    let n = i+1;
    if ((res_array.length > 0) && (res_array.indexOf(n) < 0)) {
      continue;
    }

    line = `<div class="post" id="${i+1}">`;
    line += `<div class="meta">`;
    line += `<span class="number">${i+1}</span>${delim}`
    line += `<span class="name">`
    if (x[1] == "") {
      line += `<b>${x[0]}</b></span>${delim}`;
    } else {
      line += `<b><a href="mailto:${x[1]}">${x[0]}</a></b></span>${delim}`;
    }
    line += `<span class="date">${date}</span>${delim}`;
    line += `<span class="uid">${id}</span></div>`;
    line += `<div class="message">`
    line += `<span class="escaped">${x[3]}</span>`;
    line += `</div></div><br>`;
    
    thread += line;
  }
  
  return {title: title, thread: thread};
}

function res_split(res, resnum)
{
  let r = [], m = null;
  if (res.substr(0, 1) == "l") {
    res = res.substr(1);
    let n = Number(res);
    for (let i = n; i > 0; i--) {
      r.push(resnum - i);
    }
    if (r.length > 0) {
      return r;
    }
  }
  const re_simple = new RegExp("^(\\d+)$");
  const re_range = new RegExp("^(\\d+)-(\\d+)$");
  let chunks = res.split(",");
  for (let k = 0; k < chunks.length; k++) {
    if (m = chunks[k].match(re_simple)) {
      r.push(Number(m[1]));
    }
    if (m = chunks[k].match(re_range)) {
      min = Number(m[1]);
      max = Number(m[2]);
      if (min > max) {
	tmp = max; max = min; min = max
      }
      for (let i = min; i <= max; i++) {
	r.push(i);
      }
    }
  }
  return r;
}

function ab2str(ab) {
  return String.fromCharCode.apply("", new Uint8Array(ab));
}

function str2ab(str) {
  let ab = new ArrayBuffer(str.length);
  let a = new Uint8Array(ab);
  for (let i = 0; i < str.length; i++) {
    a[i] = str.charCodeAt(i);
  }
  return ab;
}

function decode_dat(r) {
  let bytes = new Uint8Array(r);
  let str = bzip2.simple(bzip2.array(bytes));
  let ab = str2ab(str);
  let text_decoder = new TextDecoder("Shift_JIS");
  return text_decoder.decode(ab);
}

function load_thread(bbs, key, res = "") {
  let url = `dat/${bbs}/o${key.slice(0, 4)}/${key}.dat.bz2`;
  let xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.send();
  xhr.onload = function () {
    if (xhr.status == 200) {
      let r = dat2html(decode_dat(xhr.response), res);
      set_thread(r.title, r.thread);
      location.hash = `/${bbs}/${key}/${res}`;
    } else {
      set_thread("Error");
      location.hash = "";
    }
  }
  xhr.onerror = function () {
    set_thread("Error");
    location.hash = "";
  }
}

function set_thread(title = "dat2html", thread = "") {
  $("#thread").html(thread);
  $("#title").html(title);
  $("title").html(title);
}

function init_index()
{
  let url = "./index.yaml";
  let xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.send();
  xhr.onload = function () {
    if (xhr.status == 200) {
      $("#index").html(parse_index(xhr.response));
    }
  }
}

function parse_index(yaml)
{
  let index = jsyaml.load(yaml);
  let s = `<select class="bbs">\n`, s1 = {}, s2 = {};
  s += "<option value=\"\" selected>--board--</option>\n";
  for (let i in index) {
    let bbs = index[i]["bbs"];
    s += `<option value="${bbs}">${bbs}</option>\n`;
    s1[bbs] = `<select class="ord" id="${bbs}">\n`;
    s1[bbs] += `<option value="" selected>--order--</option>\n`;
    for (let j in index[i]["orders"]) {
      let ord = index[i]["orders"][j]["ord"];
      s1[bbs] += `<option value="${ord}">${ord}</option>\n`;
      let sub = `${bbs}_${ord}`;
      s2[sub] = `<select class="key" id="${sub}">\n`;
      s2[sub] += `<option value="" selected>--thread--</option>\n`;
      for (let k in index[i]["orders"][j]["keys"]) {
	let key = index[i]["orders"][j]["keys"][k];
      	s2[sub] += `<option value="${key}">${key}</option>\n`;
      }
      s2[sub] += `</select>\n`;
    }
    s1[bbs] += `</select>\n`; 
  }
  s += `</select>\n`;
  for (let i in index) {
    let bbs = index[i]["bbs"];
    s += s1[bbs];
  }
  for (let i in index) {
    let bbs = index[i]["bbs"];
    for (let j in index[i]["orders"]) {
      let ord = index[i]["orders"][j]["ord"];
      let sub = `${bbs}_${ord}`;
      s += s2[sub];
    }
  }
  return s;
}

$(function () {
  $(document).on("change", ".bbs", function () {
    let bbs = $(this).val();
    $(".ord").hide();
    $(".key").hide();
    if (bbs !== "") {
      $(`#${bbs}`).val("");
      $(`#${bbs}`).show();
    }
  });
  $(document).on("change", ".ord", function () {
    let bbs = $(".bbs").val();
    let ord = $(this).val();
    $(".key").hide();
    if (ord !== "") {
      $(`#${bbs}_${ord}`).val("")
      $(`#${bbs}_${ord}`).show()
    }
  });
  $(document).on("change", ".key", function () {
    let bbs = $(".bbs").val();
    let key = $(this).val();
    load_thread(bbs, key);
  });
  $(window).on("load hashchange", function () {
    if (location.hash != "") {
      let x = location.hash.split("/");
      load_thread(x[1], x[2], x[3]);
    }
  });
  init_index();
});
