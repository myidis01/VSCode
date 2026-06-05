import json
monsters = [
    {'id':1,'name':'버서커 스컬','health':48,'damage':16,'speed':24,'color':{'r':168,'g':28,'b':36}},
    {'id':2,'name':'블레이드 스펙터','health':40,'damage':14,'speed':28,'color':{'r':112,'g':92,'b':192}},
    {'id':3,'name':'그림자 와이번','health':54,'damage':18,'speed':22,'color':{'r':72,'g':160,'b':72}},
    {'id':4,'name':'망각의 흑기사','health':58,'damage':20,'speed':20,'color':{'r':84,'g':84,'b':112}},
    {'id':5,'name':'피의 부두사제','health':44,'damage':12,'speed':18,'color':{'r':152,'g':32,'b':64}},
    {'id':6,'name':'둥근 갑옷 전사','health':66,'damage':14,'speed':14,'color':{'r':120,'g':120,'b':120}},
    {'id':7,'name':'전율 바이퍼','health':38,'damage':16,'speed':30,'color':{'r':24,'g':168,'b':168}},
    {'id':8,'name':'불꽃 레이븐','health':42,'damage':15,'speed':26,'color':{'r':236,'g':108,'b':36}},
    {'id':9,'name':'수정 골렘','health':72,'damage':10,'speed':10,'color':{'r':52,'g':200,'b':220}},
    {'id':10,'name':'야수 소환사','health':50,'damage':14,'speed':18,'color':{'r':80,'g':52,'b':156}},
    {'id':11,'name':'저주받은 기사','health':60,'damage':18,'speed':22,'color':{'r':88,'g':24,'b':24}},
    {'id':12,'name':'늑대 인간','health':46,'damage':13,'speed':30,'color':{'r':100,'g':100,'b':56}},
    {'id':13,'name':'암흑 안내자','health':52,'damage':16,'speed':20,'color':{'r':24,'g':24,'b':112}},
    {'id':14,'name':'지옥 불꽃 정령','health':36,'damage':22,'speed':32,'color':{'r':228,'g':72,'b':24}},
    {'id':15,'name':'정글 고릴라','health':68,'damage':17,'speed':20,'color':{'r':84,'g':124,'b':44}},
    {'id':16,'name':'돌주먹 토템','health':78,'damage':12,'speed':12,'color':{'r':108,'g':96,'b':52}},
    {'id':17,'name':'긴발톱 살무사','health':42,'damage':16,'speed':30,'color':{'r':80,'g':220,'b':96}},
    {'id':18,'name':'혼돈의 네크로맨서','health':54,'damage':19,'speed':18,'color':{'r':96,'g':24,'b':120}},
    {'id':19,'name':'얼음 골렘','health':70,'damage':13,'speed':12,'color':{'r':96,'g':180,'b':220}},
    {'id':20,'name':'먹구름 히드라','health':62,'damage':20,'speed':20,'color':{'r':60,'g':60,'b':100}},
    {'id':21,'name':'번개의 사자','health':46,'damage':18,'speed':28,'color':{'r':212,'g':220,'b':64}},
    {'id':22,'name':'죽음의 수호자','health':64,'damage':18,'speed':18,'color':{'r':144,'g':64,'b':80}},
    {'id':23,'name':'썩은 시체','health':34,'damage':12,'speed':16,'color':{'r':90,'g':110,'b':60}},
    {'id':24,'name':'암살자 그림자','health':44,'damage':21,'speed':34,'color':{'r':24,'g':24,'b':24}},
    {'id':25,'name':'잠식 거미','health':50,'damage':15,'speed':26,'color':{'r':80,'g':48,'b':96}},
    {'id':26,'name':'날개 달린 망령','health':40,'damage':14,'speed':28,'color':{'r':172,'g':172,'b':216}},
    {'id':27,'name':'시간 왜곡자','health':58,'damage':17,'speed':24,'color':{'r':64,'g':144,'b':176}},
    {'id':28,'name':'지옥쥐','health':30,'damage':10,'speed':34,'color':{'r':160,'g':92,'b':32}},
    {'id':29,'name':'흉측한 돌연변이','health':66,'damage':19,'speed':18,'color':{'r':116,'g':66,'b':92}},
    {'id':30,'name':'심연의 대천사','health':80,'damage':24,'speed':22,'color':{'r':204,'g':240,'b':220}},
]
with open('Monsters/manifest.json','w', encoding='utf-8') as f:
    json.dump({'files': [f'monster_{m["id"]}.json' for m in monsters]}, f, ensure_ascii=False, indent=2)
for m in monsters:
    with open(f'Monsters/monster_{m["id"]}.json', 'w', encoding='utf-8') as f:
        json.dump(m, f, ensure_ascii=False, indent=2)
