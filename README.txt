Beschreibung

jsRsync vereinfacht die Datensicherung mit rsync. Es sichert ausgewählte Ordner auf einen Datenträger (z.B. USB-Stick, externe Festplatte) und kann dabei rsyncs Algorithmus für differenzielle Datensicherungen mittels harter Links nutzen. Dadurch wird zu jedem Sicherungszeitpunkt eine volle Datensicherung erstellt, ohne jedoch für unveränderte Dateien zusätzlichen Speicherplatz zu belegen. Gleichzeitig bleibt die Ordnerstruktur der Datensicherungen völlig transparent und kann ohne spezielle Programme nach belieben vollständig oder teilweise wiederhergestellt werden.

===============================================================================

Installation

1. Zunächst muss rsync für Windows heruntergeladen und installiert werden, so dass es im Ausführungspfad des Sicherungsskriptes zu finden ist. Alternativ kann es auch in einem Unterverzeichnis mit Namen 'rsync' im Installationsverzeichnis von jsRsync abgelegt werden.

2. Das Sicherungsskript (jsRsync.js), sowie die Konfigurationsdateien (folders.rsync, optional: exclude.rsync) sollten in dem Ordner abgelegt werden, der später für die Datensicherung genutzt werden soll.

3. Die Pfade der zu sichernden Ordner müssen in folders.rsync eingetragen werden. Dabei kommt jeder Eintrag in eine neue Zeile. Das Format ist [Name];[Pfad]. Dabei ist [Name] ein beliebiger Name, welcher während des Sicherungsprozesses zur besseren Verständlichkeit angezeigt wird. [Pfad] ist der Pfad des Ordners. Zeilen, die mit dem #-Symbol beginnen, werden ignoriert.

4. Falls gewünscht können in exclude.rsync Filterregeln zum Ausschluss von bestimmten Dateien und Ordnern angegeben werden. Ordnerspezifische Filter können unter filter.rsync im jeweiligen Ordner des Ursprungsdatenträgers hinterlegt werden. Die Syntax dieser Dateien ist in der Dokumentation von rsync erklärt.

===============================================================================

Benutzung

1. Sicherungsdatenträger anschließen.

2. Sicherungsskript (jsRsync.js) ausführen.

3. Für eine differenzielle Datensicherung muss der Name des Ordners der Referenzsicherung angegeben werden. Dies ist meist der Ordner der letzten Datensicherung und muss auf dem selben Datenträger liegen wir die neu anzulegende Sicherung.
Wird kein Referenzordner angegeben, so wird eine komplette Datensicherung erstellt und auch für unveränderte Dateien eine neue Kopie angelegt.

4. Für den Speicherort der Datensicherung kann ein beliebiger Ordnername angegeben werden. Dieser wird im Wurzelverzeichnis des Sicherungsdatenträgers angelegt.
Falls kein Ordnername angegeben wird, so wird er automatisch aus dem aktuellen Datum im Format JJJJ-MM-TT generiert.

5. Vor dem Start der Datensicherung wird eine Zusammenfassung der auszuführenden Aktionen angezeigt und die Bestätigung des Nutzers abgewartet. Bis zu diesem Zeitpunkt werden keine Dateien angelegt, verändert oder gelöscht und der Vorgang kann ohne Auswirkungen abgebrochen werden.

HINWEIS: Der Name des Sicherungsordners sowie der des Referenzordners können auch beim Aufruf des Skripts als erster, beziehungsweise zweiter Parameter übergeben werden.

HINWEIS: rsync erstellt für jeden Ordner in folders.rsync eine Logdatei im aktuellen Sicherungsordner.

===============================================================================

Bekannte Probleme

* All documentation is in German

* Absolute Pfade als Parameter für das Ziel- und Referenzverzeichnis sind nicht vorgesehen.

* Das Programm steht unter der restriktiven GPL.

===============================================================================

Dieses Skript ist als einfache, maßgeschneiderte Lösung für einige sehr spezielle Anwendungsfälle konzipiert worden. Wer ein schöneres und/oder mächtigeres Programm sucht, darf gerne von hier aus weitermachen oder sich gleich eines der vielen verfügbaren Programme im Internet bedienen.
