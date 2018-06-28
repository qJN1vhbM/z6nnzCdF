function dat2html(dat) {
  let title = "";
  let thread = "";
  const re_datetime = new RegExp("[\\d/]+\\(.+\\) [\\d{2}:.]+");
  const re_id = new RegExp("ID:[\\w+/_\?]+");
  const lines = dat.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let x = lines[i].split("<>");
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

    line = `<div class="post" id="${i+1}">`;
    line += `<div class="meta">`;
    line += `<span class="number">${i+1}</span>：`
    line += `<span class="name">`
    if (x[1] == "") {
      line += `<b>${x[0]}</b></span>：`;
    } else {
      line += `<b><a href="mailto:${x[1]}">${x[0]}</a></b></span>：`;
    }
    line += `<span class="date">${date}</span>：`;
    line += `<span class="uid">${id}</span></div>`;
    line += `<div class="message">`
    line += `<span class="escaped">${x[3]}</span>`;
    line += `</div></div><br>`;
    
    thread += line;
  }
  
  return {title: title, thread: thread};
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

function load_dat(bbs, key) {
  let u = `dat/${bbs}/o${key.slice(0, 4)}/${key}.dat.bz2`;
  let xhr = new XMLHttpRequest();
  xhr.open('GET', u, true);
  xhr.responseType = 'arraybuffer';
  xhr.send();
  xhr.onload = function () {
    if (xhr.status == 200) {
      let r = dat2html(decode_dat(xhr.response));
      setup(r.title, r.thread);
      location.hash = `/${bbs}/${key}`;
    } else {
      setup("Error");
      location.hash = "";
    }
  }
  xhr.onerror = function () {
    setup("Error");
    location.hash = "";
  }
}

function setup(title = "dat2html", thread = "") {
  $(".thread").html(thread);
  $(".title").html(title);
  $("title").html(title);
}

$(function () {
  $(".bbs").val("");
  $(".bbs").change(function () {
    let bbs = $(this).val();
    $(".ord").hide();
    if (bbs !== "") {
      $(`#${bbs}`).val("");
      $(`#${bbs}`).show();
    }
  });
  $(".ord").change(function () {
    let bbs = $(".bbs").val();
    let ord = $(this).val();
    $(".key").hide();
    if (ord !== "") {
      $(`#${bbs}_${ord}`).val("")
      $(`#${bbs}_${ord}`).show()
    }
  });
  $(".key").change(function () {
    let bbs = $(".bbs").val();
    let key = $(this).val();
    load_dat(bbs, key);
  });
});
