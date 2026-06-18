import sys
import os

# 把 backend 根目录放入 python path 方便导入 app 包
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app import models

def seed_database():
    # 确保所有表都已创建
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("清理已有中药和方剂数据...")
    db.query(models.Herb).delete()
    db.query(models.Prescription).delete()
    db.commit()

    # 1. 50 味中药材数据
    herbs_data = [
        # --- 补益药 ---
        {"id": "renshen", "name": "人参", "pinyin": "Rén Shēn", "pinyin_flat": "renshen ren shen rs", "latin": "Radix Ginseng", "image": "/herbs/renshen.png", "category": "补气药", "nature": "甘、微苦", "temperature": "微温", "meridians": ["脾", "肺", "心"], "functions": "大补元气，复脉固脱，补脾益肺，生津养血，安神益智", "usage": "3-9g，另煎兑入", "classic_ref": "《伤寒论》独参汤、四君子汤", "description": "人参为五加科植物人参的干燥根和根茎。为补气第一要药。", "contraindications": "实证、热证忌服。不宜与藜芦同用（十八反）。"},
        {"id": "huangqi", "name": "黄芪", "pinyin": "Huáng Qí", "pinyin_flat": "huangqi huang qi hq", "latin": "Radix Astragali", "image": "/herbs/huangqi.png", "category": "补气药", "nature": "甘", "temperature": "微温", "meridians": ["脾", "肺"], "functions": "补气升阳，固表止汗，利水消肿，生津养血，行滞通痹，托毒排脓", "usage": "9-30g", "classic_ref": "《金匮要略》黄芪建中汤", "description": "黄芪为豆科植物蒙古黄芪的干燥根。补气固表要药。", "contraindications": "表实邪盛、阴虚阳亢者慎用。"},
        {"id": "gancao", "name": "甘草", "pinyin": "Gān Cǎo", "pinyin_flat": "gancao gan cao gc", "latin": "Radix Glycyrrhizae", "image": "/herbs/gancao.png", "category": "补气药", "nature": "甘", "temperature": "平", "meridians": ["心", "肺", "脾", "胃"], "functions": "补脾益气，清热解毒，祛痰止咳，缓急止痛，调和诸药", "usage": "2-10g", "classic_ref": "《伤寒论》甘草泻心汤、芍药甘草汤", "description": "甘草为豆科植物甘草的干燥根和根茎。有\"国老\"之称，调和诸药。", "contraindications": "不宜与海藻、大戟、甘遂、芫花同用（十八反）。"},
        {"id": "dazao", "name": "大枣", "pinyin": "Dà Zǎo", "pinyin_flat": "dazao da zao dz", "latin": "Fructus Jujubae", "image": None, "category": "补气药", "nature": "甘", "temperature": "温", "meridians": ["脾", "胃", "心"], "functions": "补中益气，养血安神，缓和药性", "usage": "3-10枚", "classic_ref": "《伤寒论》桂枝汤", "description": "大枣为鼠李科植物枣的干燥成熟果实。常与生姜同用调和脾胃。", "contraindications": "湿热内盛、齿痛、疳积者忌服。"},
        {"id": "baizhu", "name": "白术", "pinyin": "Bái Zhú", "pinyin_flat": "baizhu bai zhu bz", "latin": "Rhizoma Atractylodis Macrocephalae", "image": "/herbs/baizhu.png", "category": "补气药", "nature": "苦、甘", "temperature": "温", "meridians": ["脾", "胃"], "functions": "健脾益气，燥湿利水，止汗，安胎", "usage": "6-12g", "classic_ref": "《伤寒论》理中丸、四君子汤", "description": "白术为菊科植物白术的干燥根茎。为健脾燥湿之要药。", "contraindications": "阴虚燥渴、气滞胀闷者慎用。"},
        {"id": "danggui", "name": "当归", "pinyin": "Dāng Guī", "pinyin_flat": "danggui dang gui dg", "latin": "Radix Angelicae Sinensis", "image": "/herbs/danggui.png", "category": "补血药", "nature": "甘、辛", "temperature": "温", "meridians": ["肝", "心", "脾"], "functions": "补血活血，调经止痛，润肠通便", "usage": "6-12g", "classic_ref": "《金匮要略》当归芍药散", "description": "当归为伞形科植物当归的干燥根。补血之圣药。", "contraindications": "湿盛中满、大便溏泄者慎用。"},
        {"id": "shaoyao", "name": "芍药", "pinyin": "Sháo Yào", "pinyin_flat": "shaoyao shao yao sy", "latin": "Radix Paeoniae", "image": "/herbs/shaoyao.png", "category": "补血药", "nature": "苦、酸", "temperature": "微寒", "meridians": ["肝", "脾"], "functions": "养血调经，敛阴止汗，柔肝止痛，平抑肝阳", "usage": "6-15g", "classic_ref": "《伤寒论》芍药甘草汤", "description": "毛茛科植物芍药的干燥根。能养血柔肝，缓急止痛。", "contraindications": "虚寒泄泻者慎用。不宜与藜芦同用（十八反）。"},
        {"id": "ejiao", "name": "阿胶", "pinyin": "Ē Jiāo", "pinyin_flat": "ejiao e jiao ej", "latin": "Colla Corii Asini", "image": None, "category": "补血药", "nature": "甘", "temperature": "平", "meridians": ["肺", "肝", "肾"], "functions": "补血滋阴，润燥，止血", "usage": "3-9g，烊化兑服", "classic_ref": "《伤寒论》黄连阿胶汤", "description": "阿胶为马科动物驴的皮去毛后熬制而成的胶块。补血要药。", "contraindications": "脾胃虚弱、消化不良者慎用。"},
        {"id": "shoudihuang", "name": "熟地黄", "pinyin": "Shú Dì Huáng", "pinyin_flat": "shoudihuang shu di huang sdh", "latin": "Radix Rehmanniae Praeparata", "image": None, "category": "补血药", "nature": "甘", "temperature": "微温", "meridians": ["肝", "肾"], "functions": "补血滋阴，益精填髓", "usage": "9-15g", "classic_ref": "《小儿药证直诀》六味地黄丸", "description": "玄参科植物地黄的干燥根经蒸晒成熟地黄。填精补髓要药。", "contraindications": "脾胃虚弱、气滞痰多、脘腹胀满者忌服。"},
        {"id": "maidong", "name": "麦冬", "pinyin": "Mài Dōng", "pinyin_flat": "maidong mai dong md", "latin": "Radix Ophiopogonis", "image": None, "category": "补阴药", "nature": "甘、微苦", "temperature": "微寒", "meridians": ["心", "肺", "胃"], "functions": "养阴生津，润肺清心", "usage": "6-12g", "classic_ref": "《伤寒论》麦门冬汤", "description": "百合科植物麦冬的干燥块根。清养肺胃阴津要药。", "contraindications": "脾胃虚寒泄泻、风寒感冒咳嗽者忌服。"},
        # --- 解表药 ---
        {"id": "mahuang", "name": "麻黄", "pinyin": "Má Huáng", "pinyin_flat": "mahuang ma huang mh", "latin": "Herba Ephedrae", "image": "/herbs/mahuang.png", "category": "解表药", "nature": "辛、微苦", "temperature": "温", "meridians": ["肺", "膀胱"], "functions": "发汗解表，宣肺平喘，利水消肿", "usage": "2-10g", "classic_ref": "《伤寒论》麻黄汤", "description": "麻黄科植物草麻黄的干燥草质茎。发汗解表之峻药。", "contraindications": "体虚多汗、失眠、高血压者慎用。"},
        {"id": "guizhi", "name": "桂枝", "pinyin": "Guì Zhī", "pinyin_flat": "guizhi gui zhi gz", "latin": "Ramulus Cinnamomi", "image": "/herbs/guizhi.png", "category": "解表药", "nature": "辛、甘", "temperature": "温", "meridians": ["心", "肺", "膀胱"], "functions": "发汗解肌，温通经脉，助阳化气，平冲降逆", "usage": "3-10g", "classic_ref": "《伤寒论》桂枝汤", "description": "樟科植物肉桂的干燥嫩枝。温阳化气，通经活血。", "contraindications": "热病、阴虚火旺、孕妇慎用。"},
        {"id": "chaihu", "name": "柴胡", "pinyin": "Chái Hú", "pinyin_flat": "chaihu chai hu ch", "latin": "Radix Bupleuri", "image": "/herbs/chaihu.png", "category": "解表药", "nature": "苦、辛", "temperature": "微寒", "meridians": ["肝", "胆"], "functions": "和解表里，疏肝解郁，升阳举陷", "usage": "3-10g", "classic_ref": "《伤寒论》小柴胡汤", "description": "伞形科植物柴胡的干燥根。为和解少阳、疏肝之要药。", "contraindications": "真阴不足、肝阳上亢者忌用。"},
        {"id": "shengjiang", "name": "生姜", "pinyin": "Shēng Jiāng", "pinyin_flat": "shengjiang sheng jiang sj", "latin": "Rhizoma Zingiberis Recens", "image": None, "category": "解表药", "nature": "辛", "temperature": "温", "meridians": ["肺", "脾", "胃"], "functions": "解表散寒，温中止呕，化痰止咳，解毒", "usage": "3-10g", "classic_ref": "《伤寒论》生姜泻心汤", "description": "姜科植物姜的新鲜根茎。有\"呕家圣药\"之称。", "contraindications": "阴虚内热者忌服。"},
        {"id": "xixin", "name": "细辛", "pinyin": "Xì Xīn", "pinyin_flat": "xixin xi xin xx", "latin": "Radix et Rhizoma Asari", "image": None, "category": "解表药", "nature": "辛", "temperature": "温", "meridians": ["心", "肺", "肾"], "functions": "祛风散寒，通窍止痛，温肺化饮", "usage": "1-3g", "classic_ref": "《伤寒论》小青龙汤", "description": "马兜铃科植物北细辛的干燥根和根茎。古称\"细辛不过钱\"。", "contraindications": "阴虚阳亢、有汗者忌服。不宜与藜芦同用（十八反）。"},
        {"id": "gegen", "name": "葛根", "pinyin": "Gě Gēn", "pinyin_flat": "gegen ge gen gg", "latin": "Radix Puerariae", "image": None, "category": "解表药", "nature": "甘、辛", "temperature": "平", "meridians": ["脾", "胃"], "functions": "解肌退热，透疹，生津止渴，升阳止泻", "usage": "10-15g", "classic_ref": "《伤寒论》葛根汤", "description": "豆科植物野葛的干燥根。能解肌发表、升发清阳。", "contraindications": "张口流涎、虚寒者慎用。"},
        {"id": "bohe", "name": "薄荷", "pinyin": "Bò Hé", "pinyin_flat": "bohe bo he bh", "latin": "Herba Menthae", "image": None, "category": "解表药", "nature": "辛", "temperature": "凉", "meridians": ["肺", "肝"], "functions": "疏散风热，清利头目，利咽，透疹，疏肝行气", "usage": "3-6g，后下", "classic_ref": "《温病条辨》银翘散", "description": "唇形科植物薄荷的干燥地上部分。宣散风热要药。", "contraindications": "体虚多汗、表虚不固者忌服。"},
        {"id": "jingjie", "name": "荆芥", "pinyin": "Jīng Jiè", "pinyin_flat": "jingjie jing jie jj", "latin": "Herba Schizonepetae", "image": None, "category": "解表药", "nature": "辛", "temperature": "微温", "meridians": ["肺", "肝"], "functions": "解表散风，透疹，消疮，止血", "usage": "5-10g", "classic_ref": "《银海精微》", "description": "唇形科植物荆芥的干燥地上部分。药性平和，风寒风热皆可用。", "contraindications": "表虚自汗、阴虚头痛者慎服。"},
        {"id": "fangfeng", "name": "防风", "pinyin": "Fáng Fēng", "pinyin_flat": "fangfeng fang feng ff", "latin": "Radix Saposhnikoviae", "image": None, "category": "解表药", "nature": "辛、甘", "temperature": "微温", "meridians": ["膀胱", "肝", "脾"], "functions": "祛风解表，胜湿止痛，止痉", "usage": "5-10g", "classic_ref": "《宣明论方》防风通圣散", "description": "伞形科植物防风的干燥根。被誉为\"风药中之润剂\"。", "contraindications": "血虚发痉、阴虚火旺者慎用。"},
        {"id": "qianghuo", "name": "羌活", "pinyin": "Qiāng Huó", "pinyin_flat": "qianghuo qiang huo qh", "latin": "Rhizoma et Radix Notopterygii", "image": None, "category": "解表药", "nature": "辛、苦", "temperature": "温", "meridians": ["膀胱", "肾"], "functions": "散寒祛风，胜湿止痛", "usage": "3-10g", "classic_ref": "《内外伤辨惑论》羌活胜湿汤", "description": "伞形科植物羌活的干燥根茎和根。治上半身风湿痹痛要药。", "contraindications": "血虚头痛、脾胃虚弱者慎服。"},
        # --- 清热药 ---
        {"id": "shigao", "name": "石膏", "pinyin": "Shí Gāo", "pinyin_flat": "shigao shi gao sg", "latin": "Gypsum Fibrosum", "image": "/herbs/shigao.png", "category": "清热药", "nature": "甘、辛", "temperature": "寒", "meridians": ["肺", "胃"], "functions": "清热泻火，除烦止渴", "usage": "15-60g，先煎", "classic_ref": "《伤寒论》白虎汤", "description": "硫酸盐类矿物石膏。为清解气分实热之大药。", "contraindications": "脾胃虚寒、血虚发热者忌服。"},
        {"id": "huangqin", "name": "黄芩", "pinyin": "Huáng Qín", "pinyin_flat": "huangqin huang qin hqin", "latin": "Radix Scutellariae", "image": None, "category": "清热药", "nature": "苦", "temperature": "寒", "meridians": ["肺", "胆", "脾", "大肠", "小肠"], "functions": "清热燥湿，泻火解毒，止血，安胎", "usage": "3-10g", "classic_ref": "《伤寒论》小柴胡汤", "description": "唇形科植物黄芩的干燥根。善清中上焦湿热。", "contraindications": "脾胃虚寒、食少便溏者忌服。"},
        {"id": "huanglian", "name": "黄连", "pinyin": "Huáng Lián", "pinyin_flat": "huanglian huang lian hl", "latin": "Rhizoma Coptidis", "image": None, "category": "清热药", "nature": "苦", "temperature": "寒", "meridians": ["心", "脾", "胃", "肝", "胆", "大肠"], "functions": "清热燥湿，泻火解毒", "usage": "2-5g", "classic_ref": "《伤寒论》黄连阿胶汤、半夏泻心汤", "description": "毛茛科植物黄连的干燥根茎。清心泻火、燥湿要药。", "contraindications": "脾胃虚寒者忌服，本品大苦大寒，易伤脾胃。"},
        {"id": "huangbai", "name": "黄柏", "pinyin": "Huáng Bǎi", "pinyin_flat": "huangbai huang bai hb", "latin": "Cortex Phellodendri Amurensis", "image": None, "category": "清热药", "nature": "苦", "temperature": "寒", "meridians": ["肾", "膀胱"], "functions": "清热燥湿，泻火除蒸，解毒疗疮", "usage": "3-12g", "classic_ref": "《伤寒论》易黄汤", "description": "芸香科植物黄皮树的干燥树皮。善清下焦湿热与虚热。", "contraindications": "脾胃虚寒者忌服。"},
        {"id": "zhizi", "name": "栀子", "pinyin": "Zhī Zǐ", "pinyin_flat": "zhizi zhi zi zz", "latin": "Fructus Gardeniae", "image": None, "category": "清热药", "nature": "苦", "temperature": "寒", "meridians": ["心", "肺", "三焦"], "functions": "泻火除烦，清热利湿，凉血解毒", "usage": "6-10g", "classic_ref": "《伤寒论》栀子豉汤", "description": "茜草科植物栀子的干燥成熟果实。清泻三焦火邪。", "contraindications": "脾虚便溏者忌服。"},
        {"id": "zhimu", "name": "知母", "pinyin": "Zhī Mǔ", "pinyin_flat": "zhimu zhi mu zm", "latin": "Rhizoma Anemarrhenae", "image": None, "category": "清热药", "nature": "苦、甘", "temperature": "寒", "meridians": ["肺", "胃", "肾"], "functions": "清热泻火，生津润燥", "usage": "6-12g", "classic_ref": "《伤寒论》白虎汤", "description": "百合科植物知母的干燥根茎。能滋阴清热、润燥止渴。", "contraindications": "脾虚便溏者忌服。"},
        {"id": "jinyinhua", "name": "金银花", "pinyin": "Jīn Yín Huā", "pinyin_flat": "jinyinhua jin yin hua jyh", "latin": "Flos Lonicerae Japonicae", "image": None, "category": "清热药", "nature": "甘", "temperature": "寒", "meridians": ["肺", "心", "胃"], "functions": "清热解毒，疏散风热", "usage": "6-15g", "classic_ref": "《温病条辨》银翘散", "description": "忍冬科植物忍冬的干燥花蕾。为清热解毒、治温病表证要药。", "contraindications": "脾胃虚寒、疮疡阴证者忌服。"},
        {"id": "lianqiao", "name": "连翘", "pinyin": "Lián Qiáo", "pinyin_flat": "lianqiao lian qiao lq", "latin": "Fructus Forsythiae", "image": None, "category": "清热药", "nature": "苦", "temperature": "微寒", "meridians": ["肺", "心", "小肠"], "functions": "清热解毒，消肿散结，疏散风热", "usage": "6-15g", "classic_ref": "《温病条辨》银翘散", "description": "木犀科植物连翘的干燥果实。被称为\"疮家圣药\"。", "contraindications": "脾胃虚寒、气虚脓清者忌服。"},
        {"id": "banlangen", "name": "板蓝根", "pinyin": "Bǎn Lán Gēn", "pinyin_flat": "banlangen ban lan gen blg", "latin": "Radix Isatidis", "image": None, "category": "清热药", "nature": "苦", "temperature": "寒", "meridians": ["心", "胃"], "functions": "清热解毒，凉血，利咽", "usage": "9-15g", "classic_ref": "《本草便读》", "description": "十字花科植物菘蓝的干燥根。清热解毒、利咽大药。", "contraindications": "脾胃虚寒者忌服。"},
        # --- 利水渗湿药 ---
        {"id": "fuling", "name": "茯苓", "pinyin": "Fú Líng", "pinyin_flat": "fuling fu ling fl", "latin": "Poria", "image": "/herbs/fuling.png", "category": "利水渗湿药", "nature": "甘、淡", "temperature": "平", "meridians": ["心", "肺", "脾", "肾"], "functions": "利水渗湿，健脾，宁心", "usage": "10-15g", "classic_ref": "《伤寒论》五苓散", "description": "多孔菌科真菌茯苓的干燥菌核。利水而不伤正气。", "contraindications": "虚寒精滑者慎用。"},
        {"id": "banxia", "name": "半夏", "pinyin": "Bàn Xià", "pinyin_flat": "banxia ban xia bx", "latin": "Rhizoma Pinelliae", "image": "/herbs/banxia.png", "category": "利水渗湿药", "nature": "辛", "temperature": "温", "meridians": ["脾", "胃", "肺"], "functions": "燥湿化痰，降逆止呕，消痞散结", "usage": "3-9g，法半夏、姜半夏等", "classic_ref": "《伤寒论》小半夏汤", "description": "天南星科植物半夏的干燥块茎。燥湿化痰、止呕要药。", "contraindications": "阴虚燥咳忌用。不宜与乌头类中药同用（十八反）。"},
        {"id": "zhuling", "name": "猪苓", "pinyin": "Zhū Líng", "pinyin_flat": "zhuling zhu ling zhl", "latin": "Polyporus", "image": None, "category": "利水渗湿药", "nature": "甘、淡", "temperature": "平", "meridians": ["肾", "膀胱"], "functions": "利水渗湿", "usage": "6-12g", "classic_ref": "《伤寒论》五苓散", "description": "多孔菌科真菌猪苓的干燥菌核。利水消肿效力强于茯苓。", "contraindications": "无湿热、阴虚津伤者慎用。"},
        {"id": "zexie", "name": "泽泻", "pinyin": "Zé Xiè", "pinyin_flat": "zexie ze xie zx", "latin": "Rhizoma Alismatis", "image": None, "category": "利水渗湿药", "nature": "甘、淡", "temperature": "寒", "meridians": ["肾", "膀胱"], "functions": "利水渗湿，泄热，化浊降脂", "usage": "6-10g", "classic_ref": "《伤寒论》五苓散", "description": "泽泻科植物泽泻的干燥块茎。利水且泄肾经虚火。", "contraindications": "肾虚精滑、无湿热者忌服。"},
        # --- 温里药 ---
        {"id": "fuzi", "name": "附子", "pinyin": "Fù Zǐ", "pinyin_flat": "fuzi fu zi fz", "latin": "Radix Aconiti Lateralis Praeparata", "image": None, "category": "温里药", "nature": "辛、甘", "temperature": "大热", "meridians": ["心", "肾", "脾"], "functions": "回阳救逆，补火助阳，散寒止痛", "usage": "3-15g，先煎半小时至一小时以减毒", "classic_ref": "《伤寒论》四逆汤", "description": "毛茛科植物乌头的子根加工品。为回阳救逆第一要药。", "contraindications": "孕妇忌服。不宜与半夏、瓜蒌、贝母、白敛、白及同用（十八反）。"},
        {"id": "ganjiang", "name": "干姜", "pinyin": "Gān Jiāng", "pinyin_flat": "ganjiang gan jiang gj", "latin": "Rhizoma Zingiberis", "image": None, "category": "温里药", "nature": "辛", "temperature": "热", "meridians": ["脾", "胃", "心", "肺"], "functions": "温中散寒，回阳通脉，温肺化饮", "usage": "3-10g", "classic_ref": "《伤寒论》理中丸、四逆汤", "description": "姜科植物姜的干燥根茎。能温脾胃之阳，又温肺化饮。", "contraindications": "阴虚火旺、血热妄行者忌服。"},
        # --- 泻下药 ---
        {"id": "dahuang", "name": "大黄", "pinyin": "Dà Huáng", "pinyin_flat": "dahuang da huang dh", "latin": "Radix et Rhizoma Rhei", "image": None, "category": "泻下药", "nature": "苦", "temperature": "寒", "meridians": ["脾", "胃", "大肠", "肝", "心包"], "functions": "泻下攻积，清热写火，凉血解毒，逐瘀通经", "usage": "5-15g，后下或开水泡服", "classic_ref": "《伤寒论》大承气汤", "description": "蓼科植物掌叶大黄的干燥根和根茎。被称为\"将军\"，泻下力强。", "contraindications": "孕妇、哺乳期、月经期及脾胃虚寒者忌服。"},
        {"id": "mangxiao", "name": "芒硝", "pinyin": "Máng Xiāo", "pinyin_flat": "mangxiao mang xiao mx", "latin": "Natrii Sulfas", "image": None, "category": "泻下药", "nature": "咸、苦", "temperature": "寒", "meridians": ["胃", "大肠"], "functions": "泻下通便，润燥软坚，清火消肿", "usage": "6-12g, 冲入药汁中溶化", "classic_ref": "《伤寒论》大承气汤", "description": "含硫酸钠的天然矿物经精制而成的结晶。润燥软坚要药。", "contraindications": "孕妇及脾胃虚寒者忌服。"},
        # --- 祛风湿药 ---
        {"id": "duhuo", "name": "独活", "pinyin": "Dú Huó", "pinyin_flat": "duhuo du huo dh", "latin": "Radix Angelicae Pubescentis", "image": None, "category": "祛风湿药", "nature": "辛、苦", "temperature": "微温", "meridians": ["肾", "膀胱"], "functions": "祛风湿，止痛，解表", "usage": "3-10g", "classic_ref": "《备急千金要方》独活寄生汤", "description": "伞形科植物重齿毛当归的干燥根。善治腰膝、下肢风湿痹痛。", "contraindications": "阴虚血燥、头痛忌服。"},
        # --- 活血化瘀药 ---
        {"id": "chuanxiong", "name": "川芎", "pinyin": "Chuān Xiōng", "pinyin_flat": "chuanxiong chuan xiong cx", "latin": "Rhizoma Chuanxiong", "image": None, "category": "活血化瘀药", "nature": "辛", "temperature": "温", "meridians": ["胆", "肝", "心包"], "functions": "活血行气，祛风止痛", "usage": "3-10g", "classic_ref": "《金匮要略》温经汤", "description": "伞形科植物川芎的干燥根茎。被称为\"血中之气药\"，治头痛要药。", "contraindications": "阴虚火旺、多汗、孕妇忌服。"},
        {"id": "danshen", "name": "丹参", "pinyin": "Dān Shēn", "pinyin_flat": "danshen dan shen ds", "latin": "Radix et Rhizoma Salviae Miltiorrhizae", "image": None, "category": "活血化瘀药", "nature": "苦", "temperature": "微寒", "meridians": ["心", "肝"], "functions": "活血祛瘀，通经止痛，清心除烦，凉血消痈", "usage": "9-15g", "classic_ref": "《本草纲目》", "description": "唇形科植物丹参的干燥根和根茎。古称\"一味丹参功同四物\"。", "contraindications": "不宜与藜芦同用（十八反）。"},
        {"id": "honghua", "name": "红花", "pinyin": "Hóng Huā", "pinyin_flat": "honghua hong hua hh", "latin": "Flos Carthami", "image": None, "category": "活血化瘀药", "nature": "辛", "temperature": "温", "meridians": ["心", "肝"], "functions": "活血通经，散瘀止痛", "usage": "3-10g", "classic_ref": "《医林改错》血府逐瘀汤", "description": "菊科植物红花的干燥花。活血祛瘀要药。", "contraindications": "孕妇及出血倾向者忌服。"},
        {"id": "taoren", "name": "桃仁", "pinyin": "Táo Rén", "pinyin_flat": "taoren tao ren tr", "latin": "Semen Persicae", "image": None, "category": "活血化瘀药", "nature": "苦、甘", "temperature": "平", "meridians": ["心", "肝", "大肠"], "functions": "活血祛瘀，润肠通便，止咳平喘", "usage": "5-10g", "classic_ref": "《伤寒论》桃核承气汤", "description": "蔷薇科植物桃的干燥成熟种子。破血行瘀、润燥通便要药。", "contraindications": "孕妇忌服，便溏者慎用。"},
        {"id": "niuxi", "name": "牛膝", "pinyin": "Niú Xī", "pinyin_flat": "niuxi niu xi nx", "latin": "Radix Achyranthis Bidentatae", "image": None, "category": "活血化瘀药", "nature": "苦、甘、酸", "temperature": "平", "meridians": ["肝", "肾"], "functions": "逐瘀通经，补肝肾，强筋骨，利尿通淋，引血下行", "usage": "5-12g", "classic_ref": "《医宗金鉴》镇肝熄风汤", "description": "苋科植物牛膝的干燥根。善治下肢关节痹痛，引火/血下行。", "contraindications": "孕妇、月经过多者忌服。"},
        {"id": "yanhusuo", "name": "延胡索", "pinyin": "Yán Hú Suǒ", "pinyin_flat": "yanhusuo yan hu suo yhs", "latin": "Rhizoma Corydalis", "image": None, "category": "活血化瘀药", "nature": "辛、苦", "temperature": "温", "meridians": ["心", "脾", "肝"], "functions": "活血，行气，止痛", "usage": "3-10g", "classic_ref": "《本草纲目》", "description": "罂粟科植物延胡索的干燥块茎。为止痛之佳品，\"专治一身上下诸痛\"。", "contraindications": "孕妇慎用。"},
        {"id": "yujin", "name": "郁金", "pinyin": "Yù Jīn", "pinyin_flat": "yujin yu jin yj", "latin": "Radix Curcumae", "image": None, "category": "活血化瘀药", "nature": "辛、苦", "temperature": "寒", "meridians": ["肝", "心", "胆"], "functions": "活血止痛，行气解郁，清心凉血，利胆退黄", "usage": "3-10g", "classic_ref": "《温病条辨》宣窍涤痰汤", "description": "姜科植物温郁金的干燥块根。能活血、行气兼疏肝解郁。", "contraindications": "不宜与丁香同用（十九畏）。孕妇慎用。"},
        # --- 理气药 ---
        {"id": "chenpi", "name": "陈皮", "pinyin": "Chén Pí", "pinyin_flat": "chenpi chen pi cp", "latin": "Pericarpium Citri Reticulatae", "image": None, "category": "理气药", "nature": "苦、辛", "temperature": "温", "meridians": ["脾", "肺"], "functions": "理气健脾，燥湿化痰", "usage": "3-10g", "classic_ref": "《局方》二陈汤", "description": "芸香科植物橘的干燥成熟果皮。健脾理气、燥湿化痰常用药。", "contraindications": "舌赤少津、内热火炽者慎服。"},
        {"id": "xiangfu", "name": "香附", "pinyin": "Xiāng Fù", "pinyin_flat": "xiangfu xiang fu xf", "latin": "Rhizoma Cyperi", "image": None, "category": "理气药", "nature": "辛、微苦、微甘", "temperature": "平", "meridians": ["肝", "三焦"], "functions": "疏肝解郁，理气宽中，调经止痛", "usage": "6-10g", "classic_ref": "《本草纲目》", "description": "莎草科植物莎草的干燥块茎。为\"气病之总司，女科之主帅\"。", "contraindications": "阴虚血热者慎用。"},
        {"id": "zhishi", "name": "枳实", "pinyin": "Zhǐ Shí", "pinyin_flat": "zhishi zhi shi zs", "latin": "Fructus Aurantii Immaturus", "image": None, "category": "理气药", "nature": "苦、辛、酸", "temperature": "微寒", "meridians": ["脾", "胃", "大肠"], "functions": "破气消积，化痰散痞", "usage": "3-10g", "classic_ref": "《伤寒论》大承气汤", "description": "芸香科植物酸橙的干燥幼果。破气除痞力量强。", "contraindications": "孕妇慎用，脾胃虚弱者无积滞慎服。"},
        # --- 消食药 / 收涩药 / 安神药 ---
        {"id": "shanzha", "name": "山楂", "pinyin": "Shān Zhā", "pinyin_flat": "shanzha shan zha sz", "latin": "Fructus Crataegi", "image": None, "category": "消食药", "nature": "酸、甘", "temperature": "微温", "meridians": ["脾", "胃", "肝"], "functions": "消食健胃，行气散瘀，化浊降脂", "usage": "9-15g", "classic_ref": "《医学衷中参西录》", "description": "蔷薇科植物山里红的干燥成熟果实。消肉食积滞要药。", "contraindications": "脾胃虚弱、胃酸过多者慎食。"},
        {"id": "wuweizi", "name": "五味子", "pinyin": "Wǔ Wèi Zǐ", "pinyin_flat": "wuweizi wu wei zi wwz", "latin": "Fructus Schisandrae Chinensis", "image": None, "category": "收涩药", "nature": "酸、甘", "temperature": "温", "meridians": ["肺", "心", "肾"], "functions": "收敛固涩，益气生津，补肾宁心", "usage": "2-6g", "classic_ref": "《伤寒论》小青龙汤", "description": "木兰科植物五味子的干燥成熟果实。五味俱全，收敛肺肾。", "contraindications": "外邪未解、内有实热、咳嗽初起者忌服。"},
        {"id": "longgu", "name": "龙骨", "pinyin": "Lóng Gǔ", "pinyin_flat": "longgu long gu lg", "latin": "Os Draconis", "image": None, "category": "安神药", "nature": "甘、涩", "temperature": "平", "meridians": ["心", "肝", "肾"], "functions": "镇静安神，平肝潜阳，收敛固涩", "usage": "15-30g，先煎", "classic_ref": "《伤寒论》桂枝甘草龙骨牡蛎汤", "description": "古代哺乳动物如象类、犀牛类、三趾马等的骨骼化石。重镇安神要药。", "contraindications": "湿热积滞者忌服。"},
        {"id": "muli", "name": "牡蛎", "pinyin": "Mǔ Lì", "pinyin_flat": "muli mu li ml", "latin": "Concha Ostreae", "image": None, "category": "安神药", "nature": "咸、涩", "temperature": "微寒", "meridians": ["肝", "胆", "肾"], "functions": "重镇安神，平肝潜阳，软坚散结，收敛固涩", "usage": "15-30g, 先煎", "classic_ref": "《伤寒论》柴胡加龙骨牡蛎汤", "description": "牡蛎科动物长牡蛎的贝壳。重镇潜阳、软坚散结佳品。", "contraindications": "虚而无热者慎用。"},
        {"id": "sharen", "name": "砂仁", "pinyin": "Shā Rén", "pinyin_flat": "sharen sha ren sr", "latin": "Fructus Amomi", "image": None, "category": "利水渗湿药", "nature": "辛", "temperature": "温", "meridians": ["脾", "胃", "肾"], "functions": "化湿开胃，温脾止泻，理气安胎", "usage": "3-6g，后下", "classic_ref": "《本草纲目》", "description": "姜科植物阳春砂的干燥成熟果实。芳香化湿、行气调胃要药。", "contraindications": "阴虚血燥、火热内炽者忌服。"}
    ]

    print(f"导入中药数据 {len(herbs_data)} 味...")
    for h in herbs_data:
        db_herb = models.Herb(**h)
        db.add(db_herb)

    # 2. 50 首经典方剂数据
    prescriptions_data = [
        # --- 1-10 伤寒名方 ---
        {
            "id": "gui-zhi-tang", "name": "桂枝汤", "pinyin": "Guì Zhī Tāng", "pinyin_flat": "guizhitang gui zhi tang gzt", "source": "《伤寒论》",
            "composition": {"桂枝": "9g", "芍药": "9g", "甘草": "6g", "生姜": "9g", "大枣": "12枚"},
            "functions": "解肌发表，调和营卫", "indications": "外感风寒表虚证。恶风发热，头痛，自汗出，鼻鸣干呕，舌苔薄白，脉浮缓。",
            "usage": "水煎服，服后啜热稀粥，温覆取微似汗", "description": "桂枝汤为《伤寒论》第一方，是调和营卫、解肌发表的代表方剂。",
            "contraindications": "表实无汗、温病、实热证忌用。"
        },
        {
            "id": "ma-huang-tang", "name": "麻黄汤", "pinyin": "Má Huáng Tāng", "pinyin_flat": "mahuangtang ma huang tang mht", "source": "《伤寒论》",
            "composition": {"麻黄": "9g", "桂枝": "6g", "杏仁": "6g", "甘草": "3g"},
            "functions": "发汗解表，宣肺平喘", "indications": "外感风寒表实证。恶寒发热，头痛身痛，无汗而喘，舌苔薄白，脉浮紧。",
            "usage": "水煎服，温覆取微汗，不须啜粥", "description": "发汗解表之峻剂，专治风寒外束、毛窍闭塞之表实证。",
            "contraindications": "表虚自汗、阴虚发热者忌用。"
        },
        {
            "id": "xiao-chai-hu-tang", "name": "小柴胡汤", "pinyin": "Xiǎo Chái Hú Tāng", "pinyin_flat": "xiaochaihutang xiao chai hu tang xcht", "source": "《伤寒论》",
            "composition": {"柴胡": "24g", "黄芩": "9g", "人参": "9g", "半夏": "9g", "甘草": "9g", "生姜": "9g", "大枣": "12枚"},
            "functions": "和解少阳，扶正祛邪", "indications": "伤寒少阳证。往来寒热，胸胁苦满，默默不欲饮食，心烦喜呕，口苦，咽干，目眩。",
            "usage": "水煎，去滓，再煎，分三次温服", "description": "和解少阳之代表方。扶正与祛邪并用，开后世和解法之先河。",
            "contraindications": "阴虚火旺、肝阳上亢者慎用。"
        },
        {
            "id": "si-jun-zi-tang", "name": "四君子汤", "pinyin": "Sì Jūn Zǐ Tāng", "pinyin_flat": "sijunzitang si jun zi tang sjzt", "source": "《太平惠民和剂局方》",
            "composition": {"人参": "9g", "白术": "9g", "茯苓": "9g", "甘草": "6g"},
            "functions": "益气健脾", "indications": "脾胃气虚证。面色萎黄，语声低微，四肢无力，食少便溏，舌淡苔白，脉细缓。",
            "usage": "水煎服", "description": "补气健脾的基础方，药性平和，温而不燥，补而不滞，如君子中庸之德。",
            "contraindications": "实热证、阴虚火旺者慎用。"
        },
        {
            "id": "wu-ling-san", "name": "五苓散", "pinyin": "Wǔ Líng Sǎn", "pinyin_flat": "wulingsan wu ling san wls", "source": "《伤寒论》",
            "composition": {"猪苓": "9g", "泽泻": "15g", "白术": "9g", "茯苓": "9g", "桂枝": "6g"},
            "functions": "利水渗湿，温阳化气", "indications": "膀胱气化不利，水湿内停。小便不利，头痛微热，烦渴欲饮，水入即吐，舌苔白，脉浮。",
            "usage": "捣为散，以白饮（米汤）送服，多饮暖水，汗出愈", "description": "利水健脾与温阳化气相结合，是水湿内停、小便不利的首选方。",
            "contraindications": "阴虚津伤、无湿热积滞者慎用。"
        },
        {
            "id": "shao-yao-gan-cao-tang", "name": "芍药甘草汤", "pinyin": "Sháo Yào Gān Cǎo Tāng", "pinyin_flat": "shaoyaogancaotang shao yao gan cao tang sygct", "source": "《伤寒论》",
            "composition": {"芍药": "12g", "甘草": "12g"},
            "functions": "调和肝脾，缓急止痛", "indications": "伤寒伤阴，筋脉失养证。脚挛急，脘腹疼痛，或神志不安，烦躁。",
            "usage": "水煎服", "description": "酸甘化阴的代表方，具有极佳的解痉止痛功效，治各种挛急疼痛。",
            "contraindications": "湿盛中满者慎用。"
        },
        {
            "id": "bai-hu-tang", "name": "白虎汤", "pinyin": "Bái Hǔ Tāng", "pinyin_flat": "baihutang bai hu tang bht", "source": "《伤寒论》",
            "composition": {"石膏": "30g", "知母": "9g", "甘草": "3g", "粳米": "9g"},
            "functions": "清热生津", "indications": "伤寒阳明气分热盛证。壮热面赤，烦渴引饮，大汗出，恶热，舌红苔黄燥，脉洪大有力。",
            "usage": "水煎服，煮至粳米熟，取清汁温服", "description": "清泻阳明气分大热之经典代表方。主治四大症：大热、大渴、大汗、脉洪大。",
            "contraindications": "表证未解、无汗、真寒假热者忌用。"
        },
        {
            "id": "da-cheng-qi-tang", "name": "大承气汤", "pinyin": "Dà Chéng Qì Tāng", "pinyin_flat": "dachengqitang da cheng qi tang dcqt", "source": "《伤寒论》",
            "composition": {"大黄": "12g", "芒硝": "9g", "枳实": "12g", "厚朴": "15g"},
            "functions": "峻下热结", "indications": "阳明腑实证。大便秘结，脘腹胀痛，按之坚硬，日晡潮热，神昏谵语，舌苔焦黄，脉沉实。",
            "usage": "水煎服。先煎枳、朴，后下大黄，烊化芒硝", "description": "寒下剂之峻剂。主治痞、满、燥、实四症俱全的肠胃燥热结实证。",
            "contraindications": "孕妇忌用。脾胃虚寒、无实热积滞者严禁使用。"
        },
        {
            "id": "xiao-cheng-qi-tang", "name": "小承气汤", "pinyin": "Xiǎo Chéng Qì Tāng", "pinyin_flat": "xiaochengqitang xiao cheng qi tang xcqt", "source": "《伤寒论》",
            "composition": {"大黄": "12g", "枳实": "9g", "厚朴": "6g"},
            "functions": "轻下热结", "indications": "阳明腑实轻证。大便秘结，潮热，谵语，脘腹痞满，按之痛，舌苔黄，脉滑数。",
            "usage": "水煎服。大黄不后下，与枳、朴同煎", "description": "大承气汤去芒硝，减枳、朴用量而成，功用较缓，清下痞满实结。",
            "contraindications": "孕妇、无实热结滞者忌服。"
        },
        {
            "id": "tiao-wei-cheng-qi-tang", "name": "调胃承气汤", "pinyin": "Tiáo Wèi Chéng Qì Tāng", "pinyin_flat": "tiaoweichengqitang tiao wei cheng qi tang twcqt", "source": "《伤寒论》",
            "composition": {"大黄": "12g", "芒硝": "9g", "甘草": "6g"},
            "functions": "缓下热结，泻火通便", "indications": "阳明腑实之燥热证。脘腹胀满不明显，但大便干结，口渴，心烦，蒸蒸发热，脉滑数。",
            "usage": "水煎服。先煎大黄、甘草，后下芒硝微沸", "description": "大承气汤去枳、朴，加甘草而成。偏于润燥软坚、清热泻火，无消痞除满作用。",
            "contraindications": "脾虚便溏、孕妇忌服。"
        },

        # --- 11-20 经方与温里名方 ---
        {
            "id": "ge-gen-tang", "name": "葛根汤", "pinyin": "Gě Gēn Tāng", "pinyin_flat": "gegentang ge gen tang ggt", "source": "《伤寒论》",
            "composition": {"葛根": "12g", "麻黄": "9g", "桂枝": "6g", "芍药": "6g", "甘草": "6g", "生姜": "9g", "大枣": "12枚"},
            "functions": "发汗解表，升津舒筋", "indications": "外感风寒表实证，兼见项背强几几（颈项僵硬）。恶寒发热，无汗，脉浮紧。",
            "usage": "水煎服，覆被取微似汗", "description": "桂枝汤加葛根、麻黄而成。主治风寒表实且经气不利之项背强痛。",
            "contraindications": "表虚汗多者忌服。"
        },
        {
            "id": "ge-gen-qin-lian-tang", "name": "葛根黄芩黄连汤", "pinyin": "Gě Gēn Huáng Qín Huáng Lián Tāng", "pinyin_flat": "gegenhuangqinhuangliantang gegengqinliantang ggqlt", "source": "《伤寒论》",
            "composition": {"葛根": "15g", "黄芩": "9g", "黄连": "6g", "甘草": "6g"},
            "functions": "解表清里", "indications": "协热下利证。身热下利，胸脘烦热，喘而汗出，舌红苔黄，脉数。",
            "usage": "水煎服", "description": "解表清里之代表方。主治表证未解，邪热入里引起的泄泻（急性肠胃炎）。",
            "contraindications": "虚寒下利者忌用。"
        },
        {
            "id": "da-qing-long-tang", "name": "大青龙汤", "pinyin": "Dà Qīng Lóng Tāng", "pinyin_flat": "daqinglongtang da qing long tang dqlt", "source": "《伤寒论》",
            "composition": {"麻黄": "12g", "桂枝": "6g", "甘草": "6g", "杏仁": "6g", "石膏": "20g", "生姜": "9g", "大枣": "10枚"},
            "functions": "发汗解表，清热除烦", "indications": "外感风寒，内有郁热。恶寒发热，身疼痛，无汗而烦躁，脉浮紧。",
            "usage": "水煎服，温服取微汗，汗出多者温粉扑之", "description": "发汗排热之重剂。针对外寒里热之「寒包火」证。",
            "contraindications": "阴虚内热、气虚多汗、少阴病者禁用。"
        },
        {
            "id": "xiao-qing-long-tang", "name": "小青龙汤", "pinyin": "Xiǎo Qīng Lóng Tāng", "pinyin_flat": "xiaoqinglongtang xiao qing long tang xqlt", "source": "《伤寒论》",
            "composition": {"麻黄": "9g", "芍药": "9g", "细辛": "3g", "干姜": "3g", "甘草": "6g", "桂枝": "6g", "半夏": "9g", "五味子": "3g"},
            "functions": "解表散寒，温肺化饮", "indications": "外寒内饮证。恶寒发热，无汗，喘咳，痰多清稀，舌苔白滑，脉浮紧。",
            "usage": "水煎温服", "description": "外散风寒，内温肺气以化寒饮之代表方。主治咳喘清稀涎沫者。",
            "contraindications": "阴虚干咳、肺热喘咳者忌服。"
        },
        {
            "id": "ling-gui-zhu-gan-tang", "name": "苓桂术甘汤", "pinyin": "Líng Guì Zhú Gān Tāng", "pinyin_flat": "lingguizhugantang ling gui zhu gan tang lgzgt", "source": "《伤寒论》",
            "composition": {"茯苓": "12g", "桂枝": "9g", "白术": "6g", "甘草": "6g"},
            "functions": "温阳化饮，健脾利湿", "indications": "中焦阳虚，痰饮内停。胸胁支满，目眩心悸，短气而咳，舌苔白滑，脉弦滑。",
            "usage": "水煎温服", "description": "温化痰饮之名方。针对脾阳不振导致的水气上冲、头晕心悸。",
            "contraindications": "阴虚火旺、热痰咳嗽者忌用。"
        },
        {
            "id": "li-zhong-wan", "name": "理中丸", "pinyin": "Lǐ Zhōng Wán", "pinyin_flat": "lizhongwan li zhong wan lzw", "source": "《伤寒论》",
            "composition": {"人参": "9g", "干姜": "9g", "白术": "9g", "甘草": "9g"},
            "functions": "温中祛寒，益气健脾", "indications": "脾胃虚寒证。脘腹绵绵作痛，喜温喜按，呕吐泄泻，脘痞食少，舌淡苔白，脉沉细无力。",
            "usage": "捣丸如弹子大，以沸水化服；亦可水煎作汤服", "description": "温中健脾的代表方。针对脾胃虚寒之吐泻腹痛有极佳疗效。",
            "contraindications": "实热证、阴虚发热者忌用。"
        },
        {
            "id": "si-ni-tang", "name": "四逆汤", "pinyin": "Sì Nì Tāng", "pinyin_flat": "sinitang si ni tang snt", "source": "《伤寒论》",
            "composition": {"附子": "15g", "干姜": "9g", "甘草": "6g"},
            "functions": "回阳救逆", "indications": "少阴病阴盛阳衰。四肢厥逆，恶寒蜷卧，神衰欲寐，呕吐下利，腹痛，脉微欲绝。",
            "usage": "水煎温服。附子须先煎", "description": "回阳救逆之急救首选方。用于少阴亡阳、冷汗自出、四肢冰冷之危重症。",
            "contraindications": "真热假寒证禁用。"
        },
        {
            "id": "dang-gui-si-ni-tang", "name": "当归四逆汤", "pinyin": "Dāng Guī Sì Nì Tāng", "pinyin_flat": "danguisinitang dang gui si ni tang dgsnt", "source": "《伤寒论》",
            "composition": {"当归": "12g", "桂枝": "9g", "芍药": "9g", "细辛": "3g", "甘草": "6g", "通草": "6g", "大枣": "8枚"},
            "functions": "温经散寒，养血通脉", "indications": "血虚寒厥证。手足厥寒，或腰、股、腿、足疼痛，舌淡苔白，脉细欲绝。",
            "usage": "水煎温服", "description": "养血通脉散寒方。主要解决因血虚、寒凝经脉导致的手脚冰凉刺痛。",
            "contraindications": "阴虚内热者忌用。"
        },
        {
            "id": "wu-mei-wan", "name": "乌梅丸", "pinyin": "Wū Méi Wán", "pinyin_flat": "wumeiwan wu mei wan wmw", "source": "《伤寒论》",
            "composition": {"乌梅": "15g", "细辛": "6g", "干姜": "10g", "黄连": "10g", "当归": "6g", "附子": "6g", "黄柏": "6g", "人参": "6g", "桂枝": "6g"},
            "functions": "温脏安蛔，缓急止痛", "indications": "蛔厥证，或久痢久泻。脘腹阵痛，烦闷呕吐，时发时止，得食则吐，手足厥冷。",
            "usage": "共为细末，炼蜜为丸，每服9g，日二三服", "description": "寒温并用、酸苦辛合投之代表方。主要治疗胃寒肠热之蛔虫引起的绞痛或慢性泄泻。",
            "contraindications": "实热积滞导致的腹痛腹泻忌服。"
        },
        {
            "id": "zhi-gan-cao-tang", "name": "炙甘草汤", "pinyin": "Zhì Gān Cǎo Tāng", "pinyin_flat": "zhigancaotang zhi gan cao tang zgct", "source": "《伤寒论》",
            "composition": {"甘草": "12g", "生姜": "9g", "人参": "6g", "生地黄": "30g", "桂枝": "9g", "阿胶": "6g", "麦冬": "10g", "麻仁": "10g", "大枣": "10枚"},
            "functions": "滋阴养血，益气温阳", "indications": "阴阳两虚。心动悸，脉结代（心律不齐），面色无华，短气神疲，舌干少苔。",
            "usage": "水与酒共煎，阿胶烊化冲服", "description": "名「复脉汤」。益气温阳与滋阴养血并重，治疗心跳悸动、脉跳不规则。",
            "contraindications": "脾虚便溏者慎服。"
        },

        # --- 21-30 补益与滋阴名方 ---
        {
            "id": "bu-zhong-yi-qi-tang", "name": "补中益气汤", "pinyin": "Bǔ Zhōng Yì Qì Tāng", "pinyin_flat": "buzhongyiqitang bu zhong yi qi tang bzyqt", "source": "《内外伤辨惑论》",
            "composition": {"黄芪": "15g", "人参": "9g", "白术": "9g", "甘草": "6g", "当归": "6g", "陈皮": "6g", "升麻": "3g", "柴胡": "3g"},
            "functions": "补中益气，升阳举陷", "indications": "脾胃气虚，气陷证。发热（气虚发热），头晕目眩，少气懒言，脏器脱垂（胃下垂、脱肛），舌淡脉虚。",
            "usage": "水煎温服", "description": "甘温除热法与升阳举陷法的奠基之方。主要解决气虚下陷和脏器脱垂。",
            "contraindications": "阴虚发热、肝阳上亢者忌用。"
        },
        {
            "id": "liu-wei-di-huang-wan", "name": "六味地黄丸", "pinyin": "Liù Wèi Dì Huáng Wán", "pinyin_flat": "liuweidihuangwan liu wei di huang wan lwdhw", "source": "《小儿药证直诀》",
            "composition": {"熟地黄": "24g", "山茱萸": "12g", "山药": "12g", "泽泻": "9g", "茯苓": "9g", "丹皮": "9g"},
            "functions": "滋补肝肾", "indications": "肝肾阴虚证。腰膝酸软，头晕目眩，耳鸣耳聋，盗汗遗精，手足心热，舌红少苔，脉细数。",
            "usage": "共为细末，炼蜜为丸，日服2次，每次9g", "description": "滋阴补肾基础方。\"三补三泻\"，补中有泻，以补为主，补而不腻。",
            "contraindications": "脾虚便溏、痰湿内盛者忌服。"
        },
        {
            "id": "ba-wei-shen-qi-wan", "name": "八味肾气丸", "pinyin": "Bā Wèi Shén Qì Wán", "pinyin_flat": "bawaishenqiwan ba wei shen qi wan bwsqw", "source": "《金匮要略》",
            "composition": {"熟地黄": "24g", "山茱萸": "12g", "山药": "12g", "泽泻": "9g", "茯苓": "9g", "丹皮": "9g", "桂枝": "3g", "附子": "3g"},
            "functions": "温补肾阳", "indications": "肾阳不足证。腰痛脚软，身半以下常有冷感，小便不利或反多，阳痿早泄，舌淡胖，脉沉细。",
            "usage": "共为末，炼蜜为丸，如梧桐子大，每服15-25丸", "description": "温补肾阳之祖方。在六味地黄丸基础上引入微量桂、附以「少火生气」。",
            "contraindications": "阴虚火旺者禁用。"
        },
        {
            "id": "xiao-yao-san", "name": "逍遥散", "pinyin": "Xiāo Yáo Sǎn", "pinyin_flat": "xiaoyaosan xiao yao san xys", "source": "《太平惠民和剂局方》",
            "composition": {"柴胡": "9g", "当归": "9g", "白芍": "9g", "白术": "9g", "茯苓": "9g", "甘草": "6g", "薄荷": "3g", "煨姜": "3g"},
            "functions": "疏肝解郁，养血健脾", "indications": "肝郁血虚脾弱证。两胁作痛，神疲食少，月经不调，乳房胀痛，脉弦而虚。",
            "usage": "水煎服，入生姜、薄荷同煎", "description": "调和肝脾、女科常用舒郁良方。疏肝、养血、健脾三法齐备。",
            "contraindications": "阴虚阳亢、肝风内动者忌用。"
        },
        {
            "id": "gui-pi-tang", "name": "归脾汤", "pinyin": "Guī Pí Tāng", "pinyin_flat": "guipitang gui pi tang gpt", "source": "《正体类要》",
            "composition": {"黄芪": "12g", "龙眼肉": "12g", "人参": "9g", "白术": "9g", "酸枣仁": "9g", "当归": "9g", "茯神": "9g", "远志": "6g", "木香": "6g", "甘草": "3g"},
            "functions": "益气补血，健脾养心", "indications": "心脾两虚，脾不统血。心悸怔忡，失眠多梦，体倦食少，便血崩漏，舌淡苔白，脉细弱。",
            "usage": "水煎服，入生姜、大枣同煎", "description": "心脾同治、气血双补之代表方。治疗失眠、健忘与慢性出血。",
            "contraindications": "内热炽盛、湿热中阻者忌服。"
        },
        {
            "id": "si-wu-tang", "name": "四物汤", "pinyin": "Sì Wù Tāng", "pinyin_flat": "siwutang si wu tang swt", "source": "《仙授理伤续断秘方》",
            "composition": {"当归": "12g", "川芎": "9g", "白芍": "12g", "熟地黄": "15g"},
            "functions": "补血和血", "indications": "营血虚滞证。面色无华，唇甲色淡，头晕眼花，心悸，月经不调，脐腹痛，脉细。",
            "usage": "水煎温服", "description": "补血调经之总方。一切血虚、血瘀引起的月经疾病多从此方化裁而来。",
            "contraindications": "脾虚便溏、脘腹胀满者慎服。"
        },
        {
            "id": "ba-zhen-tang", "name": "八珍汤", "pinyin": "Bā Zhēn Tāng", "pinyin_flat": "bazhentang ba zhen tang bzt", "source": "《正体类要》",
            "composition": {"人参": "9g", "白术": "9g", "茯苓": "9g", "甘草": "5g", "当归": "12g", "川芎": "8g", "白芍": "9g", "熟地黄": "15g"},
            "functions": "气血双补", "indications": "气血两虚。面色苍白或萎黄，头晕眼花，四肢倦怠，心悸怔忡，少气懒言，舌淡苔白，脉细弱。",
            "usage": "水煎温服，加生姜、大枣同煎", "description": "四君子汤（补气）合四物汤（补血）之组合方，调治气血两虚。",
            "contraindications": "湿热内盛、感冒发热者忌服。"
        },
        {
            "id": "shi-quan-da-bu-tang", "name": "十全大补汤", "pinyin": "Shí Quán Dà Bǔ Tāng", "pinyin_flat": "shiquandabutang shi quan da bu tang sqdbt", "source": "《传信适用方》",
            "composition": {"人参": "9g", "白术": "9g", "茯苓": "9g", "甘草": "5g", "当归": "12g", "川芎": "8g", "白芍": "9g", "熟地黄": "15g", "黄芪": "12g", "肉桂": "3g"},
            "functions": "温补气血", "indications": "气血两虚，积劳虚损。面色萎黄，畏寒肢冷，神疲乏力，疮疡不敛，舌淡，脉细无力。",
            "usage": "水煎温服", "description": "八珍汤加入黄芪以增强补气，加入肉桂以温阳化气，适用于大病初愈、极度虚损者。",
            "contraindications": "阴虚内热、实热证者忌用。"
        },
        {
            "id": "sheng-mai-yin", "name": "生脉饮", "pinyin": "Shēng Mài Yǐn", "pinyin_flat": "shengmaiyin sheng mai yin smy", "source": "《内外伤辨惑论》",
            "composition": {"人参": "9g", "麦冬": "9g", "五味子": "6g"},
            "functions": "益气生津，敛阴止汗", "indications": "气阴两伤。汗多神疲，体倦乏力，口渴咽干，久咳肺虚，气短懒言，脉虚数。",
            "usage": "水煎服；现常有中成药口服液", "description": "补气、养阴、收敛三药并投，使气复津生、汗敛脉复，为夏季防暑伤气阴之良剂。",
            "contraindications": "感冒初起、表邪未解者忌用。"
        },
        {
            "id": "shen-ling-bai-zhu-san", "name": "参苓白术散", "pinyin": "Shēn Líng Bái Zhù Sǎn", "pinyin_flat": "shenlingbaizhusan shen ling bai zhu san slbzs", "source": "《太平惠民和剂局方》",
            "composition": {"人参": "15g", "茯苓": "15g", "白术": "15g", "山药": "15g", "莲子肉": "10g", "白扁豆": "12g", "薏苡仁": "10g", "砂仁": "6g", "桔梗": "6g", "甘草": "9g"},
            "functions": "益气健脾，渗湿止泻", "indications": "脾虚湿盛。饮食不消，胸脘痞闷，或吐或泻，面色萎黄，形体消瘦，舌淡苔白腻，脉缓弱。",
            "usage": "共为细末，每次服6g，枣汤或温开水调下；亦可作汤剂水煎服", "description": "补脾祛湿之代表方。融健脾与渗湿为一炉，兼有\"培土生金\"（补脾以益肺）之功。",
            "contraindications": "阴虚燥渴、大便干结者忌服。"
        },

        # --- 31-40 温病与清热名方 ---
        {
            "id": "yin-qiao-san", "name": "银翘散", "pinyin": "Yín Qiáo Sǎn", "pinyin_flat": "yinqiaosan yin qiao san yqs", "source": "《温病条辨》",
            "composition": {"金银花": "15g", "连翘": "15g", "桔梗": "10g", "薄荷": "10g", "竹叶": "6g", "甘草": "6g", "荆芥穗": "8g", "淡豆豉": "10g", "牛蒡子": "10g", "芦根": "15g"},
            "functions": "辛凉透表，清热解毒", "indications": "温病初起之风热犯肺证。发热，微恶风寒，无汗或汗出不畅，头痛口渴，咽喉肿痛，舌尖红，脉浮数。",
            "usage": "共为粗末，鲜芦根汤煎，香气大出即取服，勿过煮", "description": "温病派「辛凉平剂」之代表方。治疗感冒初起，身热、咽喉肿痛显著者。",
            "contraindications": "风寒感冒忌用。"
        },
        {
            "id": "sang-ju-yin", "name": "桑菊饮", "pinyin": "Sāng Jú Yǐn", "pinyin_flat": "sangjuyin sang ju yin sjy", "source": "《温病条辨》",
            "composition": {"桑叶": "9g", "菊花": "9g", "杏仁": "6g", "桔梗": "6g", "连翘": "5g", "薄荷": "3g", "甘草": "3g", "芦根": "6g"},
            "functions": "疏风清热，宣肺止咳", "indications": "风热犯肺之咳嗽轻证。咳嗽，身热不甚，微渴，脉浮数。",
            "usage": "水煎温服。同银翘散一样不宜久煎", "description": "温病「辛凉轻剂」。重在宣肺止咳，适用于热度较低但咳嗽较突出的风热咳嗽。",
            "contraindications": "阴虚干咳、寒痰咳嗽者忌用。"
        },
        {
            "id": "huo-xiang-zheng-qi-san", "name": "藿香正气散", "pinyin": "Huò Xiāng Zhèng Qì Sǎn", "pinyin_flat": "huoxiangzhengqisan huo xiang zheng qi san hxzqs", "source": "<code>《太平惠民和剂局方》</code>",
            "composition": {"大腹皮": "9g", "白芷": "6g", "紫苏叶": "9g", "茯苓": "9g", "半夏曲": "9g", "陈皮": "6g", "白术": "9g", "厚朴": "6g", "桔梗": "6g", "广藿香": "12g", "甘草": "3g"},
            "functions": "解表化湿，理气和中", "indications": "外感风寒，内伤湿滞证。恶寒发热，胸膈满闷，恶心呕吐，肠鸣泄泻，舌苔白腻，脉濡缓。",
            "usage": "水煎温服，入姜、枣同煎；现常有藿香正气水/软胶囊", "description": "治疗暑湿感冒、肠胃型感冒的圣药。既散外寒，又化内湿，调和胃肠。",
            "contraindications": "阴虚火旺、暑热内盛（高热大渴）者忌服。"
        },
        {
            "id": "ping-wei-san", "name": "平胃散", "pinyin": "Píng Wèi Sǎn", "pinyin_flat": "pingweisan ping wei san pws", "source": "《太平惠民和剂局方》",
            "composition": {"苍术": "12g", "厚朴": "9g", "陈皮": "9g", "甘草": "6g"},
            "functions": "燥湿运脾，行气和胃", "indications": "湿滞脾胃证。脘腹胀满，口苦无味，肢体沉重，恶心呕吐，大便溏泻，舌苔白厚腻，脉缓。",
            "usage": "为粗末，煎服，入生姜、大枣同煎", "description": "祛湿运脾之核心方剂。用于脾胃湿阻、胃气不和引起的胀满纳呆。",
            "contraindications": "阴虚血虚、孕妇慎用。"
        },
        {
            "id": "ban-xia-xie-xin-tang", "name": "半夏泻心汤", "pinyin": "Bàn Xià Xiè Xīn Tāng", "pinyin_flat": "banxiaxiexintang ban xia xie xin tang bxxdt", "source": "《伤寒论》",
            "composition": {"半夏": "9g", "黄芩": "9g", "干姜": "9g", "人参": "9g", "甘草": "9g", "黄连": "3g", "大枣": "12枚"},
            "functions": "寒热平调，消痞散结", "indications": "寒热错杂之痞证。心下痞满而不痛，干呕或肠鸣下利，舌苔黄白相兼，脉弦数。",
            "usage": "水煎，去滓，再煎，分三次温服", "description": "寒热并用、辛开苦降的经典方。专门调治中焦水火不通、寒热交结引起的心下痞闷。",
            "contraindications": "气滞食积引起的心下胀痛忌服。"
        },
        {
            "id": "sheng-jiang-xie-xin-tang", "name": "生姜泻心汤", "pinyin": "Shēng Jiāng Xiè Xīn Tāng", "pinyin_flat": "shengjiangxiexintang sheng jiang xie xin tang sjxxt", "source": "《伤寒论》",
            "composition": {"生姜": "12g", "甘草": "9g", "人参": "9g", "干姜": "3g", "黄琴": "9g", "半夏": "9g", "黄连": "3g", "大枣": "12枚"},
            "functions": "和胃消痞，宣散水气", "indications": "水热互结于心下。心下痞硬，干噫食臭（打嗝有酸臭味），腹中雷鸣下利，小便不利。",
            "usage": "水煎温服", "description": "半夏泻心汤减干姜用量，重用生姜而成。重在和胃气以宣散中焦积聚的水气与宿食。",
            "contraindications": "脾胃虚寒严重，无热证者忌用。"
        },
        {
            "id": "gan-cao-xie-xin-tang", "name": "甘草泻心汤", "pinyin": "Gān Cǎo Xiè Xīn Tāng", "pinyin_flat": "gancaoxiexintang gan cao xie xin tang gcxxt", "source": "《伤寒论》",
            "composition": {"甘草": "12g", "黄芩": "9g", "干姜": "9g", "半夏": "9g", "黄连": "3g", "大枣": "12枚"},
            "functions": "和胃消痞，清热扶正", "indications": "中焦虚损严重，寒热错杂。心下痞满硬痛，干呕下利不止，完谷不化，食物难消，口腔溃疡（狐惑病）。",
            "usage": "水煎温服", "description": "半夏泻心汤重用甘草而成。重在健脾和胃、急救中气虚弱，又治狐惑病（粘膜溃疡）。",
            "contraindications": "脘腹实胀、食积未消者忌服。"
        },
        {
            "id": "mai-men-dong-tang", "name": "麦门冬汤", "pinyin": "Mài Mén Dōng Tāng", "pinyin_flat": "maimendongtang mai men dong tang mmdt", "source": "《金匮要略》",
            "composition": {"麦冬": "30g", "半夏": "6g", "人参": "9g", "甘草": "6g", "粳米": "10g", "大枣": "12枚"},
            "functions": "滋养肺胃，降逆下气", "indications": "肺胃阴虚，气逆呕喘。咳唾涎沫，短气咽干，干咳无痰，或咳而气喘；或胃阴不足之呕吐，舌红少苔，脉虚数。",
            "usage": "水煎温服", "description": "培土生金、火逆上气之良方。重用麦冬大滋肺胃之阴，配微量半夏以下气清宣。",
            "contraindications": "风寒咳嗽、湿盛痰多者忌服。"
        },
        {
            "id": "zhu-ye-shi-gao-tang", "name": "竹叶石膏汤", "pinyin": "Zhú Yè Shí Gāo Tāng", "pinyin_flat": "zhuyeshigaotang zhu ye shi gao tang zysgt", "source": "《伤寒论》",
            "composition": {"竹叶": "6g", "石膏": "30g", "半夏": "9g", "人参": "6g", "甘草": "6g", "麦冬": "20g", "粳米": "10g"},
            "functions": "清热生津，益气和胃", "indications": "伤寒余热未清，气津两伤。身热多汗，虚羸少气，口干作渴，心烦欲呕，舌红少苔，脉虚数。",
            "usage": "水煎温服", "description": "白虎加人参汤去知母，加入竹叶、麦冬、半夏而成。用于热病后期清理余热并清养胃气。",
            "contraindications": "阴寒证、无热气津未伤者忌用。"
        },
        {
            "id": "suan-zao-ren-tang", "name": "酸枣仁汤", "pinyin": "Suān Zǎo Rén Tāng", "pinyin_flat": "suanzaorentang suan zao ren tang szrt", "source": "《金匮要略》",
            "composition": {"酸枣仁": "15g", "甘草": "3g", "知母": "6g", "茯苓": "6g", "川芎": "6g"},
            "functions": "养血安神，清热除烦", "indications": "虚劳虚烦不得眠。心悸盗汗，头目眩晕，咽干口燥，脉细弦。",
            "usage": "水煎，温服", "description": "养血清热安神之名方。针对肝血不足、虚热内扰引起的心神不宁、失眠多梦。",
            "contraindications": "遗精、滑泄及脾虚便溏者慎用。"
        },

        # --- 41-50 其他各科代表方剂 ---
        {
            "id": "tian-wang-bu-xin-dan", "name": "天王补心丹", "pinyin": "Tiān Wáng Bǔ Xīn Dān", "pinyin_flat": "tianwangbuxindan tian wáng bu xin dan twbxd", "source": "《摄生秘剖》",
            "composition": {"生地黄": "120g", "人参": "15g", "玄参": "15g", "丹参": "15g", "茯苓": "15g", "桔梗": "15g", "远志": "15g", "当归": "30g", "五味子": "30g", "麦冬": "30g", "天冬": "30g", "酸枣仁": "30g", "柏子仁": "30g"},
            "functions": "滋阴养血，补心安神", "indications": "阴虚血少，神志不安。心悸失眠，虚烦神疲，梦遗健忘，口舌生疮，大便干结，舌红少苔，脉细数。",
            "usage": "共为细末，炼蜜为丸如梧桐子大，每服9g，临卧时灯心草煎汤送下", "description": "滋阴清热、补心安神之著名大方。针对心肾不交之失眠多梦。",
            "contraindications": "脾胃虚弱、痰湿内盛者忌服。"
        },
        {
            "id": "long-dan-xie-gan-tang", "name": "龙胆泻肝汤", "pinyin": "Lóng Dǎn Xiè Gān Tāng", "pinyin_flat": "longdanxiegantang long dan xie gan tang ldxgt", "source": "《医宗金鉴》",
            "composition": {"龙胆草": "6g", "黄芩": "9g", "栀子": "9g", "泽泻": "12g", "木通": "6g", "车前子": "9g", "当归": "3g", "生地黄": "9g", "柴胡": "6g", "甘草": "6g"},
            "functions": "清胆泻肝，利湿通淋", "indications": "肝胆实火上扰，或湿热下注。头痛目赤，胁痛口苦，耳聋耳肿；或阴痒阴肿，小便淋浊，妇人带下黄臭，舌红苔黄腻，脉弦数有力。",
            "usage": "水煎服", "description": "清泻肝胆实火及下焦湿热的代表方剂。泻中有补，利中寓滋。",
            "contraindications": "脾胃虚寒、阴虚阳亢者忌服。本品易伤胃，中病即止，不可久服。"
        },
        {
            "id": "dao-chi-san", "name": "导赤散", "pinyin": "Dǎo Chì Sǎn", "pinyin_flat": "daochisan dao chi san dcs", "source": "《小儿药证直诀》",
            "composition": {"生地黄": "9g", "木通": "6g", "甘草梢": "6g", "淡竹叶": "6g"},
            "functions": "清心利尿", "indications": "心经火盛证。心胸烦热，口渴面赤，意欲饮冷，口舌生疮；或心火下移小肠，小便赤涩刺痛，舌红，脉数。",
            "usage": "水煎服", "description": "清心火并从小便导出的代表方。主治心火旺盛并下移小肠之口疮尿赤。",
            "contraindications": "脾胃虚寒、小便清长者忌服。"
        },
        {
            "id": "qing-ying-tang", "name": "清营汤", "pinyin": "Qīng Yíng Tāng", "pinyin_flat": "qingyingtang qing ying tang qyt", "source": "《温病条辨》",
            "composition": {"犀角（现用水牛角代替）": "30g", "生地黄": "15g", "玄参": "9g", "竹叶心": "3g", "麦冬": "9g", "丹参": "6g", "黄连": "5g", "金银花": "9g", "连翘": "6g"},
            "functions": "清营透热，凉血解毒", "indications": "热入营分证。身热夜甚，神烦少寐，时有谵语，目常喜闭，口渴不甚，斑疹隐隐，舌质红绛，脉细数。",
            "usage": "水煎服", "description": "温病清营凉血代表方。通过\"透热转气\"，将深伏营分的邪热透引出表以解。",
            "contraindications": "热在气分（发热大渴但舌不红绛）、或有湿邪者忌用。"
        },
        {
            "id": "xi-jiao-di-huang-tang", "name": "犀角地黄汤", "pinyin": "Xī Jiǎo Dì Huáng Tāng", "pinyin_flat": "xijiaodihuangtang xi jiao di huang tang xjdht", "source": "《备急千金要方》",
            "composition": {"犀角（现用水牛角代替）": "30g", "生地黄": "24g", "芍药": "12g", "牡丹皮": "9g"},
            "functions": "清热解毒，凉血散瘀", "indications": "热入血分。吐血，衄血，便血，尿血，身热，神昏谵语，斑疹紫黑，舌红绛，脉数有力。",
            "usage": "水煎服，水牛角先煎或磨汁冲服", "description": "清热凉血散瘀之祖方。专治热入血分引起的神昏谵语及各种出血斑疹。",
            "contraindications": "虚寒出血忌用。"
        },
        {
            "id": "er-chen-tang", "name": "二陈汤", "pinyin": "Èr Chén Tāng", "pinyin_flat": "erchentang er chen tang ect", "source": "《太平惠民和剂局方》",
            "composition": {"半夏": "15g", "橘红（陈皮）": "15g", "茯苓": "9g", "甘草": "4.5g"},
            "functions": "燥湿化痰，理气和中", "indications": "湿痰咳嗽证。咳嗽痰多，色白易咯，胸脘痞闷，恶心呕吐，肢体沉重，舌苔白润，脉滑。",
            "usage": "水煎服，入生姜、乌梅同煎", "description": "治痰基础方。陈皮、半夏皆以陈久者良，故名\"二陈\"，能燥湿并理气调胃。",
            "contraindications": "阴虚干咳、咯血者忌服。"
        },
        {
            "id": "wen-dan-tang", "name": "温胆汤", "pinyin": "Wēn Dǎn Tāng", "pinyin_flat": "wendantang wen dan tang wdt", "source": "《三因极一病证方论》",
            "composition": {"半夏": "6g", "竹茹": "6g", "枳实": "6g", "陈皮": "9g", "甘草": "3g", "茯苓": "5g"},
            "functions": "理气化痰，温胆和胃", "indications": "胆郁痰扰证。胆怯易惊，虚烦不眠，夜多异梦，眩晕呕吐，心悸怔忡；或吐涎沫，舌苔白腻，脉弦滑。",
            "usage": "水煎服，加生姜、大枣同煎", "description": "二陈汤加竹茹、枳实而成。清胆和胃、化痰定惊之良方，主治失眠心悸、胆怯多梦。",
            "contraindications": "阴虚火旺者慎服。"
        },
        {
            "id": "su-zi-jiang-qi-tang", "name": "苏子降气汤", "pinyin": "Sū Zǐ Jiàng Qì Tāng", "pinyin_flat": "suzijiangqitang su zi jiang qi tang szjqt", "source": "《太平惠民和剂局方》",
            "composition": {"紫苏子": "9g", "半夏": "9g", "当归": "6g", "甘草": "6g", "前胡": "6g", "厚朴": "6g", "肉桂": "3g"},
            "functions": "降气平喘，祛痰止咳", "indications": "痰涎壅盛，肾阳不足之喘咳证。胸膈满闷，喘咳痰多清稀，腰酸脚软，肢体浮肿，舌苔白滑，脉弦滑。",
            "usage": "水煎温服，入生姜、苏叶、大枣同煎", "description": "治\"上实下虚\"咳喘之名方。上焦痰涎壅盛而气逆（实），下焦肾阳不足而纳气无力（虚）。",
            "contraindications": "肺肾两虚之单纯气喘、阴虚干咳者忌用。"
        },
        {
            "id": "xue-fu-zhu-yu-tang", "name": "血府逐瘀汤", "pinyin": "Xuè Fǔ Zhú Yū Tāng", "pinyin_flat": "xuefuzhuyutang xue fu zhu yu tang xfzyt", "source": "《医林改错》",
            "composition": {"桃仁": "12g", "红花": "9g", "当归": "9g", "生地黄": "9g", "川芎": "5g", "赤芍": "6g", "牛膝": "9g", "桔梗": "5g", "柴胡": "3g", "枳壳": "6g", "甘草": "3g"},
            "functions": "活血祛瘀，行气止痛", "indications": "胸中血瘀，气机阻滞。胸痛，头痛，日久不愈，痛如针刺而有定处，或入暮潮热，心悸失眠，急躁易怒，舌暗红有瘀点，脉涩。",
            "usage": "水煎服", "description": "王清任活血化瘀名方。主治胸中（即血府）血瘀，集活血、行气、祛瘀、升清、引下于一体。",
            "contraindications": "孕妇及出血倾向者忌服。"
        },
        {
            "id": "tao-hong-si-wu-tang", "name": "桃红四物汤", "pinyin": "Táo Hóng Sì Wù Tāng", "pinyin_flat": "taohongsiwutang tao hong si wu tang thswt", "source": "《医宗金鉴》",
            "composition": {"熟地黄": "15g", "当归": "12g", "白芍": "10g", "川芎": "8g", "桃仁": "9g", "红花": "6g"},
            "functions": "养血活血，祛瘀调经", "indications": "妇人营血虚滞，瘀血阻滞。月经不调，经期提前，经血量多、色紫黑有块，或痛经，舌有瘀斑，脉细涩。",
            "usage": "水煎温服", "description": "四物汤中加入桃仁、红花而成。补血中富有破血散瘀之功，为治妇科瘀血之首选方。",
            "contraindications": "孕妇忌服，无瘀血之血虚证者慎用。"
        }
    ]

    print(f"导入经典方剂数据 {len(prescriptions_data)} 首...")
    for p in prescriptions_data:
        db_prescription = models.Prescription(**p)
        db.add(db_prescription)

    db.commit()

    # 3. 初始化默认超级管理员账户
    print("初始化默认超级管理员账户...")
    admin_email = "admin@qihuang.com"
    from app.core import auth  # 导入 auth 模块进行密码哈希
    admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user:
        hashed_password = auth.get_password_hash("admin123")
        new_admin = models.User(
            email=admin_email,
            hashed_password=hashed_password,
            name="超级管理员",
            is_admin=True
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        
        # 为超级管理员初始化空白健康画像 (Profile)
        new_profile = models.Profile(user_id=new_admin.id)
        db.add(new_profile)
        db.commit()
        print("默认超级管理员创建成功: admin@qihuang.com / admin123")

    db.close()
    print("数据库种子数据初始化成功！")

if __name__ == "__main__":
    seed_database()
