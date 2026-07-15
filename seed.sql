-- 运行方式：Supabase 项目 → SQL Editor → New query → 粘贴 → Run
-- 作用：插入示例空间数据（会议室 / 宴会厅 / 多功能厅），预约记录留空由系统使用中产生。
-- 可以重复运行前先执行 delete，避免主键冲突报错。

delete from spaces;

insert into spaces (id, name, type, floor, capacity, equip) values
  ('s1', '启明会议室', '会议室', '3F', 8, array['投影','视频会议']),
  ('s2', '远见会议室', '会议室', '3F', 16, array['投影','白板']),
  ('s3', '汇思会议室', '会议室', '5F', 6, array['电视屏']),
  ('s4', '云顶宴会厅', '宴会厅', '1F', 120, array['舞台','音响']),
  ('s5', '翠湖宴会厅', '宴会厅', '1F', 60, array['音响']),
  ('s6', '星空多功能厅（可分区）', '多功能厅', '2F', 200, array['音响','灯光','直播']);
