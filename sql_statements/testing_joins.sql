-- SQLite
-- SELECT id, name
-- FROM ServerClasses;

-- -- SQLite
-- SELECT id, hostname
-- FROM hosts;

-- -- SQLite
-- SELECT *
-- FROM serverClassByHost;

SELECT sc.id AS serverClassId, h.*
FROM serverClasses sc
INNER JOIN serverClassByHost sch ON sch.serverClassId = sc.id
INNER JOIN hosts h ON sch.hostId = h.id
;

-- INSERT INTO 
-- serverClassByHost 
-- (serverClassId, hostId)
-- VALUES
-- (3,6)