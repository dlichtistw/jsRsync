// ****************************************************************************
//	jsRsync - A JavaScript wrapper for the WSH around the rsync CLI
//	Copyright (C) 2015  David Lichti <dlichtistw@gmx.de>
//	
//	This program is free software: you can redistribute it and/or modify
//	it under the terms of the GNU General Public License as published by
//	the Free Software Foundation, either version 3 of the License, or
//	(at your option) any later version.
//	
//	This program is distributed in the hope that it will be useful,
//	but WITHOUT ANY WARRANTY; without even the implied warranty of
//	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//	GNU General Public License for more details.
//	
//	You should have received a copy of the GNU General Public License
//	along with this program. If not, see <http://www.gnu.org/licenses/>.
// ****************************************************************************

// Abkürzungen
function echo (str) {
	return WScript.Echo(str);
}
var arguments = WScript.Arguments;
var stdOut = WScript.StdOut;
var stdIn = WScript.StdIn;
var sh = WScript.CreateObject('WScript.Shell');
var fs = WScript.CreateObject('Scripting.FileSystemObject');

// Variablen
var buffer = ''; // Ausgabepuffer zur bedingten verzögerten Ausgabe.
var flist = [];
var filter_param = '';
var exclude_param = '';
var link_param = '';
var log_param = '';
var sim_param = '';
var report = '';
var stat = {
	'fcount': 0,
	'ucount': 0,
	'xcount': 0,
	'cbcount': 0,
	'xbcount': 0
};

// Falls das Skript nicht in CScript.exe läuft, wird versucht, es explizit mit CScript.exe auszuführen
if ((env = fs.GetBaseName(WScript.Fullname).toLowerCase()) != 'cscript') {
	var args = '';
	for (var i = 0; i < WScript.Arguments.length; i++) {
		args += ' ' + WScript.Arguments(i);
	}
	
	try {
		ec = sh.Run('cscript ' + WScript.ScriptFullName + args);
	} catch (err) {
		ec = 1;
	} finally {
		WScript.Quit(ec);
	}
}

// Zeigt Lizenzinformationen an
function showLicense (length) {
	switch (length) {
	case 'short':
		echo('\
jsRsync  Copyright (C) 2015 David Lichti <dlichtistw@gmx.de>\n\
This is free software, and you are welcome to redistribute it under certain\n\
conditions. This program comes with ABSOLUTELY NO WARRANTY. Use the -l option\n\
for more details.\n');
		break;
	case 'medium':
	default:
		echo('\
jsRsync 0.1 - A JavaScript wrapper for the WSH around the rsync CLI\n\
Copyright (C) 2015  David Lichti <dlichtistw@gmx.de>\n\
\n\
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\n\
\n\
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.\n\
\n\
You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.');
		break;
	}
}

// Zeigt Hilfe zu Benutzung an
function showHelp () {
	echo('\
Syntax:\n\
jsRsync [Optionen] [Ziel] [Referenz]\n\
\n\
\n\
Verfügbare Argumente und Optionen sind:\n\
\n\
   [Ziel]            Setzt [Ziel] als Basisordner für die Datensicherung.\n\
                     (Pfad relativ zum Arbeitsverzeichnis. (siehe -w))\n\
\n\
   [Referenz]        Aktiviert die differentielle Datensicherung und setzt\n\
                     [Referenz] als Referenzordner. (Pfad relativ zum\n\
                     Arbeitsverzeichnis. (siehe -w))\n\
\n\
   -b [Ziel]         Setzt [Ziel] als Basisordner für die Datensicherung.\n\
                     (Pfad relativ zum Arbeitsverzeichnis. (siehe -w))\n\
                     Falls [Ziel] nicht angegeben, wird nicht der Standardname\n\
                     verwendet und stattdessen ein Ordnername\n\
                     interaktiv abgefragt.\n\
\n\
   -d [Referenz]     Aktiviert die differentielle Datensicherung.\n\
                     Falls angegeben wird [Referenz] als Referenzordner\n\
                     genutzt. (Pfad relativ zum Arbeitsverzeichnis. (siehe -w))\n\
\n\
   -D                Deaktiviert die differentielle Datensicherung.\n\
\n\
   -f [Liste]        Setzt [Liste] als Datei mit der Liste der zu sichernden\n\
                     Ordner.\n\
                     Falls [Liste] nicht angegeben, wird nicht der\n\
                     Standardname verwendet und stattdessen ein Dateiname\n\
                     interaktiv abgefragt.\n\
\n\
   -w [Ausgang.]     Setzt [Ausgang.] als Ausgangsverzeichnis für die\n\
                     Datensicherung. Die Ordnernamen für -d und -b beziehen\n\
                     sich auf diesen Ordner.\n\
                     Falls [Ausgang.] nicht angegeben, wird nicht der\n\
                     Standardordner verwendet und stattdessen ein Ordnername\n\
                     interaktiv abgefragt.\n\
\n\
   -q                Es wird versucht, das Programm mölichst vollautomatisch\n\
                     auszuführen. Wenn möglich werden alle Abfragen mit \'Ja\'\n\
                     oder dem austomatischen Vorschlag beantwortet.\n\
\n\
   -n                Simuliert eine Datensicherung mit den gegebenen\n\
                     Parametern.\n\
\n\
   -l                Zeigt Lizenzinformationen an.\n\
\n\
   -h                Zeigt diese Bedienhilfe an.\n\
\n\
\n\
Beispiele:\n\
\n\
   jsRsync\n\
\n\
Alle nötigen Informationen werden interaktiv abgefragt.\n\
\n\
\n\
   jsRsync -q ' + new Date().toSQLDateString() + ' 2015-02-15\n\
\n\
Führt eine differentielle Datensicherung nach ' + new Date().toSQLDateString() + ' mit 2015-02-15 als\n\
Referenzordner aus. Wenn möglich werden alle Abfragen automatisch beantwortet.\n\
\n\
\n\
Weitere Informationen finden sich in README.txt.');
}

// Ein Date-Objekt in eine Zeichenkette umwandeln
Date.prototype.toSQLDateString = function () {
	function fill (str, len) {
		while (str.length < len) {
			str = '0' + str;
		}
		
		return str;
	}
	
	return this.getFullYear() + '-' + fill(String(this.getMonth() + 1), 2) + '-' + fill(String(this.getDate()), 2);
}

// Füllt str bis length mit chr auf side auf.
function fill (str, length, chr, side) {
	if (String(str).length >= length) {
		return str;
	} else {
		if (String(chr) < 1) {
			chr = ' ';
		}
		if (side == 0) {
			return fill(chr + str, length, chr, side);
		} else {
			return fill(str + chr, length, chr, side);
		}
	}
}

// Wandelt einen DOS-Pfad in einen absoluten CygWin-Pfad um.
function CygWinPath (path) {
	return path.replace(/^([A-Za-z])\:/, '/cygdrive/$1').replace(/\\/g, '/');
}

// Zu sichernde Ordner aus einer Datei einlesen
function parseFList (fname) {
	var files = [];
	
	if (fs.FileExists(fname)) {
		var file = fs.OpenTextFile(fname);
	} else {
		return false;
	}
	
	var pattern = /^([^#].*);([^#]*)/;
	while (!file.AtEndOfStream) {
		var line = file.ReadLine();
		
		if (line && (match = line.match(pattern))) {
			files[files.length] = {
				'name': match[1],
				'path': match[2]
			}
		}
	}
	
	return files;
}

// Such im aktuellen und im Arbeitsverzeichnis nach der Ordnerliste
function findFList (fname) {
	if (fname) {
		if (!fs.FileExists(fname)) {
			if (fs.FileExists(fs.BuildPath(args.working_dir, fname))) {
				fname = fs.BuildPath(args.working_dir, fname);
			} else {
				return false;
			}
		}
		
		var list = parseFList(fname);
		if (list !== false && list.length > 0) {
			return fname;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

// Führt einen Befehl aus und liefert den Exit-Code zurück.
function execute (cmd, pOut, pErr, pIn) {
//TODO: pIn verarbeiten
	try {
		var exec = sh.Exec(cmd);
		
		while (exec.Status == 0) {
			while (pOut && !exec.StdOut.AtEndOfStream) {
				echo(exec.StdOut.ReadLine());
			}
			while (pErr && !exec.StdErr.AtEndOfStream) {
				echo(exec.StdErr.ReadLine());
			}
		}
		
		while (pOut && !exec.StdOut.AtEndOfStream) {
			echo(exec.StdOut.ReadLine());
		}
		while (pErr && !exec.StdErr.AtEndOfStream) {
			echo(exec.StdErr.ReadLine());
		}
		
		return exec.ExitCode;
	} catch (err) {
		return false;
	}
}

// Liest eine Datenmenge ein bzw. stellt sie angenehm dar.
function parseFSize (str) {
	if (sm = str.replace(/\s+/, '').match(/(\d+(?:(?:\.|,)(\d+))?)(K|M|G|T)?B?/i)) {
		var exp = 0;
		switch (sm[3].toLowerCase()) { // Für jeden Präfix wird der Exponent von 1024 um 1 erhöht
		case 't':
			exp++;
		case 'g':
			exp++;
		case 'm':
			exp++;
		case 'k':
			exp++;
		}
	}
	
	return Math.round((sm[1].replace(/\.|,/, '') * Math.pow(1024, exp)) / Math.pow(10, sm[2] ? sm[2].length : 0));
}
function printFSize (val) {
	var unit = ['', 'k', 'M', 'G', 'T'];
	
	if (val == 0) { // Vermeide ln(0)
		return '0 B';
	} else {
		var exp = Math.floor(Math.log(val) / Math.log(1024)); // Gauss-Klammer des 1024-Logarithmus von val
		var str = String(Math.round((100 * val) / Math.pow(1024, exp)));
		return str.substr(0, str.length - 2) + '.' + str.substr(str.length - 2) + ' ' + unit[exp] + 'B';
	}
}

// Liefert einen kompaktifizierten Pfad zurück der höchstens so lang ist wie das angegebene Limit.
function compPath (path, limit) {
	if (limit < 20) { // So kurze Pfade sind nicht praktikabel.
		return path;
	}
	
	if (path.length > limit) {
// Liefert das nächste Segment vom linken oder rechten Ende des Pfades
		function getSegment (path, side) {
			if (side == 0) {
				if (m = path.match(/[^\/\\]*[\/\\]+$/)) {
					return m[0];
				}
			} else {
				if (m = path.match(/^[\/\\]+[^\/\\]*/)) {
					return m[0];
				}
			}
			return false;
		}
		
		var root = path.match(/^(?:\w+\:)?[\/\\]*[^\/\\]+/)[0];
		if (root == '') {
			return path;
		} else {
			path = path.substr(root.length);
		}
		
		var base = path.match(/[^\/\\]*$/)[0];
		if (base == '') {
			return root.substr(0, limit - 3) + '...';
		} else {
			path = path.substr(0, path.length - base.length);
		}
		
		for (i = 0; (s = getSegment(path, i % 2)) && (root.length + base.length + s.length + 5 < limit); i++) {
			if (i % 2 == 0) {
				base = s + base;
				path = path.substr(0, path.length - s.length);
			} else {
				root = root + s;
				path = path.substr(s.length);
			}
		}
		
		if (path.length <= 5) {
			var sep = path;
		} else {
			var sep = '/.../';
		}
		
		if (root.length + sep.length + base.length <= limit) {
			return root + sep + base;
		} else {
			if (root.length + sep.length > limit / 2) {
				root = root.substr(0, Math.max(limit / 2, limit - base.length) - sep.length - 3) + '...';
			}
			if (root.length + sep.length + base.length <= limit) {
				return root + sep + base;
			} else {
				base = base.substr(0, limit - root.length - sep.length - 3) + '...';
				return root + sep + base;
			}
		}
	} else {
		return path;
	}
}

// Wrapper für die Ausführung von rsync
var rsync = {
	'command': 'rsync', // Befehl zur Ausführung von rsync
	'phase': 0, // Persitenter Speicher für die Phase der rsync-Ausführung
	'dir': '', // aktuelles Sicherungsobjekt
	'fcount': 0, // Gesicherte Dateien
	'xcount': 0, // Übertragene Dateien
	'ucount': 0, // Unveränderte Dateien
	'last_file': '', // Zuletzt behandelte Datei
	'xpending': false, // Dateiübertragung zu erwarten
	'cbcount': 0, // Gesicherte Datenmenge in Byte
	'xbcount': 0 // Übertragene Datenmenge
};

// Setzt die internen Variablen zurück
rsync.reset = function () {
	this.phase = 0;
	this.dir = '';
	this.fcount = 0;
	this.xcount = 0;
	this.ucount = 0;
	this.cbcount = 0;
	this.xbcount = 0;
	this.last_file = '';
	this.xpending = false;
}

// Ermittelt den Befehl zur Ausführung von rsync
rsync.where = function () {
	if (execute('where rsync') == 0) {
		this.command = 'rsync';
		return true;
	} else if (fs.FileExists('rsync\\rsync.exe')) {
		this.command = fs.GetFullPathName('rsync\\rsync.exe');
		return true;
	} else {
		return false;
	}
}

// Filtert und übersetzt die Ausgaben von rsync
rsync.parseOut = function (out) {
	switch (this.phase) {
	case 0:
		if (/^sending incremental file list$/.test(out)) {
			echo('\tDateilisten werden verglichen.');
			break;
		}
	case 1:
		if (
			/^delta-transmission disabled/.test(out)
			|| /^created directory/.test(out)
		) {
// Phase 0 sollte jetzt abgeschlossen sein.
			this.phase = Math.max(this.phase, 1);
			break;
		}
	case 2: // Datenübertragungen
		var dirExp = new RegExp('^' + this.dir + '(\\.\\w*)?\\/');
		if (dirExp.test(out)) { // Dies ist höchstwahrscheinlich eine Ausgabezeile über einen Ordner- oder Dateitransfer
			this.phase = Math.max(this.phase, 2);
			
			if (/\/$/.test(out)) { // Verzeichnis angelegt, uninteressant
				break;
			} else { // Datei gefunden
				this.fcount++;
				if (m = out.match(/(.*) is uptodate$/)) { // Datei war unverändert
					this.ucount++;
					this.last_file = m[1];
					break;
				} else { // Datei ist zu behandeln
					this.last_file = out;
					this.xpending = true;
					break;
				}
			}
			
			echo('Unbekannt: ' + out);
			break;
		}
		if (this.xpending && (xm = out.match(/\s*(\d+(?:\.\d+)?(?:K|M|G|T)?)\s*(\d+\%)\s*(\d+(?:\.\d+)?(?:k|M|G|T)B\/s)\s*(\d+\:\d+\:\d+)\s*\(xfer#(\d+),\s*to-check\=(\d+)\/(\d+)/i))) { // Dateiübertragung
			this.phase = Math.max(this.phase, 2);

			echo('   ' + fill(compPath(this.last_file, 40), 45, ' ', 1) + ' (' + fill(printFSize(parseFSize(xm[1])), 10, ' ', 1) + ' in ' + xm[4] + ')');
			this.xcount++;
			this.xpending = false;
			this.xbcount += parseFSize(xm[1]);
			break;
		}
	
	case 3:
		if (
			/^total\: matches/.test(out)
			|| /^sent \d+(\.\d+)?(K|M|G|T)? bytes/.test(out)
		) {
			this.phase = Math.max(this.phase, 3);
			break;
		}
		if (m = out.match(/^total size is (\d+(?:\.\d+)?(K|M|G|T)?)\s*speedup is (\d+(?:\.\d+)?)/)) {
			this.phase = Math.max(this.phase, 3);
			this.cbcount = parseFSize(m[1]);
			break;
		}
	
	default:
		if (/^\s*$/.test(out)) {
			break;
		}
		echo('Unbekannt in Phase ' + this.phase + ': ' + out);
		break;
	}
}

// Führt rsync mit den angegebenen Parametern aus und sammelt die Ausgabe.	
rsync.execute = function (args) {
	var ret = {};
	
	var exec = sh.Exec('rsync' + (args ? ' ' + args : ''));
	while (exec.Status == 0) {
		while (!exec.StdOut.AtEndOfStream) {
			this.parseOut(exec.StdOut.ReadLine());
		}
		while (!exec.StdErr.AtEndOfStream) {
			stdOut.Write('stdErr: ');
			this.parseOut(exec.StdErr.ReadLine());
		}
	}
	while (!exec.StdOut.AtEndOfStream) {
		this.parseOut(exec.StdOut.ReadLine());
	}
	while (!exec.StdErr.AtEndOfStream) {
		stdOut.Write('stdErr: ');
		this.parseOut(exec.StdErr.ReadLine());
	}
	
	stdOut.WriteBlankLines(1);
	echo('Dateien überprüft/unverändert/übertragen: ' + this.fcount + '/' + this.ucount + '/' + this.xcount);
	echo('Daten überprüft/übertragen: ' + printFSize(this.cbcount) + '/' + printFSize(this.xbcount));
	
	ret.fcount = this.fcount;
	ret.ucount = this.ucount;
	ret.xcount = this.xcount;
	ret.cbcount = this.cbcount;
	ret.xbcount = this.xbcount;
	ret.exit = exec.ExitCode;
		
	return ret;
}

// Speicherplatz für die Kommandozeilenargumente (und deren Standardwerte)
var args = {
	'working_dir': WScript.ScriptFullName.match(/(.+)[\/\\][^\/\\]+$/)[1], // Ausgangspfad für alle anderen relativen Pfadangaben
	
	'folder_list': 'folders.rsync', // Liste der zu sichernden Ordner
	
	'diff': '', // Differentielle Datensicherung durchführen
	'diff_base': '', // Vergleichsordner für die differentielle Datensicherung
	
	'backup_base': new Date().toSQLDateString(), // Basispfad für die Datensicherung
	
	'quiet': false, // Wenn möglich alle Benutzerinteraktionen vorwegnehmen und Standardwerte oder Ja benutzen.
	'dryRun': false // Probelauf: Alle Operationen werden lediglich simuliert.
};

// Verarbeiten der Kommandozeilenargumente
for (var i = 0, j = 0; i < arguments.length; i++) {
	switch (arguments(i)) {
// Differentielle Datensicherung aktivieren (und Referenzordner übergeben)
	case '-d':
		args.diff = true;
		if (i + 1 < arguments.length && arguments(i + 1).charAt(0) != '-') {
			args.diff_base = arguments(++i);
			j++;
		}
		break;
// Keine differentielle Datensicherung durchführen
	case '-D':
		args.diff = false;
		args.diff_base = '';
		break;

// Basispfad für die Datensicherung übergeben (oder Standard leeren)
	case '-b':
		if (i + 1 < arguments.length && arguments(i + 1).charAt(0) != '-') {
			args.backup_base = arguments(++i);
			j++;
		} else {
			args.backup_base = '';
		}
		break;
		
// Datei mit der Ordnerliste angeben (oder Standard leeren)
	case '-f':
		if (i + 1 < arguments.length && arguments(i + 1).charAt(0) != '-') {
			args.folder_list = arguments(++i);
		} else {
			args.folder_list = '';
		}
		break;
		
// Arbeitsverzeichnis angeben (oder Standard leeren)
	case '-w':
		if (i + 1 < arguments.length && arguments(i + 1).charAt(0) != '-') {
			args.working_dir = arguments(++i);
		} else {
			args.working_dir = '';
		}
		break;
		
// Benutzerinteraktionen vermeiden
	case '-q':
		args.quiet = true;
		break;
// Sicherung simulieren
	case '-n':
		args.dryRun = true;
		buffer = '\n';
		break;
	
// Lizenzinformationen
	case '-l':
		showLicense('medium');
		WScript.Quit(0);
		break;
// Bedienungshilfe
	case '-h':
		showLicense('short');
		showHelp();
		WScript.Quit();
		
	default:
		if (arguments(i).charAt(0) == '-') {
			showLicense('short');
			echo('Ungültige Option ' + arguments(i) + '\n');
			showHelp();
			WScript.Quit(1);
		} else {
			switch (j++) {
// Basispfad für die Datensicherung übergeben
			case 0:
				args.backup_base = arguments(i);
				break;
// Differentielle Datensicherung aktivieren und Referenzordner übergeben
			case 1:
				args.diff = true;
				args.diff_base = arguments(i);
				break;

			default:
				showLicense('short');
				echo('Überzähliges Argument ' + arguments(i) + '\n');
				showHelp();
				WScript.Quit(1);
				break;
			}
		}
		break;
	}
}

showLicense('short');

if (args.dryRun) {
	echo('Achtung: Dies ist ein Probelauf. Es werden keine Daten gesichert.');
	echo('');
}

// Prüfe die Verfügbarkeit von rsync
while (rsync.where() == false) {
	echo('Fehler: rsync wurde nicht gefunden.\n');
	
	if (2 == sh.popup('Fü die Durchführung der Datensicherung wird rsync benutzt. Bitte sorgen Sie dafür, dass rsync.exe im Ausführungspfad vorhanden ist.\n\nFür weitere Informationen zur Installation, siehe README und rsync.samba.org.', 0, 'Fehler bei der Datensicherung', 0x5 | 0x10)) {
		WScript.Quit(1);
	}
}

// Sammeln fehlender Informationen:
// Prüfe, ob ein Ordner mit dem angegebenen Namen im Skriptverzeichnis existiert und fordere gegebenenfalls den Benutzer zur erneuten Eingabe auf.
while (!(args.working_dir && fs.FolderExists(args.working_dir))) {
	stdOut.Write('Kein gültiges Arbeitsverzeichnis angegeben.')
	if (args.working_dir) {
		stdOut.Write(' (' + args.working_dir + ')');
	}
	echo('');
	
	stdOut.Write('Argbeitsverzeichnis angeben: ');
	args.working_dir = stdIn.ReadLine();
	stdOut.WriteBlankLines(1);
}

// Prüfe, ob eine Datei mit dem angegebenen Namen im Skriptverzeichnis oder im Arbeitsverzeichnis existiert und fordere den Benutzer zur erneuten Eingabe auf.
while (!args.folder_list || !findFList(args.folder_list)) {
	stdOut.Write('Ungültige oder leere Ordnerliste angegeben.')
	if (args.folder_list) {
		stdOut.Write(' (' + args.folder_list + ') ');
	}
	echo('');
	stdOut.Write('Ordnerliste angeben: ');
	
	var guess = findFList('folders.rsync');
	if (guess !== false) {
		stdOut.Write('[' + guess + '] ');
	}
	
	if (args.quiet && guess !== false) {
		echo(guess);
		args.folder_list = guess;
	} else {
		args.folder_list = stdIn.ReadLine();
	}
	stdOut.WriteBlankLines(1);
}
flist = parseFList(args.folder_list);

// Prüfe, ob ein differentielles Backup durchgeführt werden soll
while (args.diff !== true && args.diff !== false) {
	stdOut.Write('Soll eine differentielle Datensicherung durchgeführt werden? [j|n] ');
	
	if (args.quiet) {
		echo('j');
		var input = 'j';
	} else {
		var input = stdIn.ReadLine();
	}
	if (input) {
		if (input.charAt(0).toLowerCase() == 'j') {
			args.diff = true;
		} else if (input.charAt(0).toLowerCase() == 'n') {
			args.diff = false;
		}
	}
	stdOut.WriteBlankLines(1);
}

// Prüfe, ob ein Ordner mit dem angegebenen Namen im Arbeitsverzeichnis existiert und fordere gegebenenfalls den Benutzer zur erneuten Eingabe auf.
while (args.diff && !(args.diff_base && fs.FolderExists(fs.BuildPath(args.working_dir, args.diff_base)))) {
	stdOut.Write('Kein gültiger Vergleichsordner angegeben.')
	if (args.diff_base) {
		stdOut.Write(' (' + args.diff_base + ')');
	}
	echo('');
	
	buffer = 'Vorhandene Ordner:\n';
	var folders = new Enumerator(fs.GetFolder(args.working_dir).subFolders);
	var guess = '';
	while (!folders.atEnd()) {
		guess = fs.GetFileName(folders.item());

// Liste der vorhandenen Ordner im Arbeitsverzeichnis
		if (buffer) {
			stdOut.Write(buffer);
			buffer = '';
		}
		echo('\t' + guess);
		
		folders.moveNext();
	}
	
	stdOut.Write('Vergleichsordner angeben: ');
// Falls kein Ordner angegeben, wird der letzte Ordner im Arbeitsverzeichnis übernommen.
	if (guess) {
		stdOut.Write('[' + guess + '] ');
	}
	if (args.quiet && guess) {
		echo(guess);
		args.diff_base = guess;
	} else {
		args.diff_base = stdIn.ReadLine();
		if (!args.diff_base) {
			args.diff_base = guess;
		}
	}
	stdOut.WriteBlankLines(1);
}

// Prüfe, ob ein Ordner mit dem angegebenen Namen im Arbeitsverzeichnis existiert und fordere gegebenenfalls den Benutzer zur erneuten Eingabe auf.
while (!args.backup_base || fs.FolderExists(fs.BuildPath(args.working_dir, args.backup_base))) {
	while (!args.backup_base) {
		echo('Kein Name für den Sicherungsordner angegeben.');
		
	// Falls kein Ordner angegeben, wird ein Name aus dem aktuellen Datum generiert.
		var guess = new Date().toSQLDateString();
		stdOut.Write('Sicherungsordner angeben: [' + guess + '] ');
		
		if (args.quiet) {
			echo(guess);
			args.backup_base = guess;
		} else {
			args.backup_base = stdIn.ReadLine();
			if (!args.backup_base) {
				args.backup_base = guess;
			}
		}
		stdOut.WriteBlankLines(1);
	}
	
// Prüfe, ob der Ordner bereits existiert oder identisch mit dem Vergleichsordner ist und fordere gegebenenfalls zur Bestätigung auf.
	if (args.backup_base && fs.FolderExists(fs.BuildPath(args.working_dir, args.backup_base))) {
		if (args.diff_base && fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.diff_base)) == fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.backup_base))) {
			echo('Der Sicherungsordner darf nicht identisch mit dem Vergleichsordner sein.');
			args.backup_base = '';
			stdOut.WriteBlankLines(1);
			continue;
		}
		
		echo('Der Ordner \'' + args.backup_base + '\' existiert bereits im Arbeitsverzeichnis.');
		stdOut.Write('Trotzdem als Sicherungsverzeichnis benutzen? [J|n] ');
		
		if (args.quiet) {
			stdOut.Write('j');
			var input = 'j';
		} else {
			var input = stdIn.ReadLine();
		}
		stdOut.WriteBlankLines(1);
		
		if (input && input.charAt(0).toLowerCase() != 'j') {
			args.backup_base = '';
		} else {
			break;
		}
	}
}

// Zusammenfassung erstellen
var summary = '';
summary += 'Von folgenden Ordnern wird ein Backup erstellt:\n';
for (i in flist) {
	summary += '\t' + flist[i].name + ' (' + flist[i].path + ')\n';
}
summary += '\n';

if (args.diff) {
	summary += 'Die Dateien werden mit vorhandenen Versionen in ' + fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.diff_base)) + ' verglichen.\n';
} else {
	summary += 'Es wird eine komplett neue Datensicherung angelegt.\n';
}
summary += '\n';

summary += 'Die Sicherung wird in ' + fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.backup_base)) + ' angelegt.\n';

// Zusammenfassung anzeigen und Bestätigung abwarten
do {
	stdOut.WriteBlankLines(1);
	echo('Zusammenfassung:');
	echo('-------------------------------------------------------------------------------');
	stdOut.Write(summary);
	echo('-------------------------------------------------------------------------------');
	
	if (args.quiet) {
		stdOut.Write('Soll die Datensicherung jetzt angelegt werden? [j|n] ');
		echo('j');
		var input = 1;
		stdOut.WriteBlankLines(1);
	} else {
		var input = sh.popup(summary + '\n\nFortfahren und Datensicherung anlegen?', 0, 'Zusammenfassung', 0x20 | 0x1 | 0x100);
	}
	
	if (input == 2) {
		echo('Datensicherung wird abgebrochen. Keine Dateien wurden verändert.');
		WScript.Quit(0);
	}
} while (input != 1);

// Anpassen der Parameter für rsync
filter_param = ' --filter=": filter.rsync"';
if (fs.FileExists(fs.BuildPath(args.working_dir, 'exclude.rsync'))) {
	exclude_param = ' --exclude="' + CygWinPath(fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, 'exclude.rsync'))) + '"';
}
if (args.diff) {
	link_param = ' --link-dest="' + CygWinPath(fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.diff_base))) + '"';
}
if (args.dryRun) {
	sim_param = ' -n';
}

stdOut.WriteBlankLines(1);
// Durchführung der Datensicherung
for (i in flist) {
	log_param = ' --log-file="' + CygWinPath(fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, fs.BuildPath(args.backup_base, flist[i].name + '.log')))) + '"';
	
	if (flist[i].path && (fs.FolderExists(flist[i].path) || fs.FileExists(flist[i].path))) {
		if (!fs.FolderExists(fs.BuildPath(args.working_dir, args.backup_base))) {
			fs.CreateFolder(fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.backup_base)));
		}
		
		echo('Beginne mit der Sicherung von ' + flist[i].name);
		stdOut.WriteBlankLines(1);
		
		rsync.reset();
		rsync.dir = fs.GetBaseName(CygWinPath(flist[i].path));
		var res = rsync.execute('-ac --progress -h -vv' + sim_param + filter_param + exclude_param + log_param + link_param + ' "' + CygWinPath(fs.GetAbsolutePathName(flist[i].path)) + '" "' + CygWinPath(fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.backup_base))) + '"');
		
		for (prop in stat) {
			stat[prop] += res[prop];
		}
	} else {
		echo(flist[i].name + ' (' + flist[i].path + ') wurde nicht gefunden.');
	}
	stdOut.WriteBlankLines(2);
}

// Abschlussbericht
buffer = '';
if (args.dryRun) {
	report += buffer;
	report += '+++++Achtung: Dies war ein Probelauf.+++++\n'
	report += '+++++Es wurden keine Daten gesichert.+++++\n';
	buffer = '\n\n';
}

// Sicherungsobjekte und -ziele
report += buffer;
buffer = '';
report += 'Folgende Ordner wurden gesichert:\n';
for (i in flist) {
	report += '\t' + flist[i].name + ' (' + flist[i].path + ')\n';
	buffer = '\n';
}
report += buffer;
report += 'Die Daten wurden gesichert in:\n';
report += '\t' + fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.backup_base)) + '\n';
if (args.diff) {
	report += 'Als Referenz wurden Dateien in folgendem Ordner genutzt:\n';
	report += '\t' + fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.diff_base)) + '\n';
}
buffer = '\n\n';

// Zusammenfassende Statistik
report += buffer
report += 'Dateien überprüft: \t\t' + stat.fcount + '\n';
report += 'Dateien übertragen: \t\t' + stat.xcount + '\n';
report += 'Dateien unverändert: \t' + stat.ucount + '\n';
report += '\n';
report += 'Daten überprüft: \t\t' + printFSize(stat.cbcount) + '\n';
report += 'Daten übertragen: \t\t' + printFSize(stat.xbcount) + '\n';
buffer = '\n\n';

// Informationen über den Sicherungsdatenträger
try {
	var drive = fs.GetDrive(fs.GetDriveName(fs.GetAbsolutePathName(args.working_dir)));
	var dl = drive.DriveLetter;
	var vn = drive.VolumeName;
	var ts = drive.TotalSize;
	var as = drive.AvailableSpace;
	
	if (dl) {
		report += buffer;
		report += 'Sicherungsdatenträger: \t' + dl + ':' + (vn ? ' (' + vn + ')' : '') + '\n';
		buffer = '';
	} else if (vn) {
		report += buffer;
		report += 'Sicherungsdatenträger: \t' + vn + '\n';
		buffer = '';
	}
	if (ts) {
		report += buffer;
		report += 'Datenträgergröße: \t\t' + printFSize(ts) + '\n';
		buffer = '';
	}
	if (as !== undefined) {
		report += buffer;
		report += 'Verfügbarer Speicher: \t' + printFSize(as) + (ts ? ' (' + Math.round(100 * (as / ts)) + ' %)' : '') + '\n';
		buffer = '';
	}
	buffer = '\n\n';
} catch (err) {}

// Wir besorgen uns nochmal frische Objekte um Laufzeitfehler zu vermeiden
var fs = WScript.CreateObject('Scripting.FileSystemObject');

report += buffer;
report += 'Ausführliche Logdateien in:\n';
report += fs.GetAbsolutePathName(fs.BuildPath(args.working_dir, args.backup_base)) + '\n';
buffer = '\n\n';

sh.popup(report, 0, 'Abschlussbericht Datensicherung', 0x40);

WScript.Quit(0);