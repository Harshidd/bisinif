# BiSinif

Öğretmen odaklı okul iş akışlarını tek panelde toplamayı hedefleyen pratik bir okul çalışma sistemi.

## Genel Bakış

BiSinif, öğretmenlerin günlük okul işlerinde kullandığı dağınık araçları ve tekrar eden işlemleri azaltmak için geliştirilen modüler bir üründür. Amaç gösterişli bir yönetim paneli kurmak değil; sınav, sınıf ve evrak süreçlerinde öğretmenin gerçekten ihtiyaç duyduğu işleri daha düzenli, hızlı ve düşük sürtünmeli hale getirmektir.

Proje, okul içinde sık tekrarlanan görevleri tek bir dijital çalışma katmanında toplamaya çalışır. Bu yüzden BiSinif yalnızca bir analiz aracı veya belge üretici değildir; öğretmenin gün içinde tekrar tekrar döndüğü temel akışları bir arada ele alan büyüyen bir okul iş akışı sistemidir.

## BiSinif Felsefesi

BiSinif'in ürün yaklaşımı sade ve pratiktir:

- Öğretmenin günlük iş yükünü azaltmak
- Aynı bilgiyi farklı yerlerde tekrar tekrar girdirmemek
- Kritik okul işlerini tek panelden yönetilebilir hale getirmek
- Hızlı ve güvenilir çıktı üretmek
- Yerel geliştirme ve pratik kullanım üzerinden ilerlemek
- Ürün kararlarını gerçek okul işi etrafında almak

Bu proje için önemli olan, her modülün sahadaki öğretmen işine karşılık gelmesidir. Gereksiz karmaşıklık yerine kontrollü, anlaşılır ve sürdürülebilir akışlar tercih edilir.

## Ana Modüller

### Sınav Analizi

Sınav sonuçlarını, kazanım dağılımlarını ve öğrenci başarı durumlarını daha okunabilir hale getiren analiz alanıdır. Öğretmenin sınav sonrası değerlendirme sürecini hızlandırmayı ve sınıf düzeyindeki tabloyu daha net görmesini amaçlar.

### Sınıf Yönetimi

Öğrenci listeleri, sınıf bilgileri ve sınıf içi operasyonlara temel oluşturan yönetim alanıdır. BiSinif'in diğer modüllerinde kullanılan okul ve sınıf bağlamının daha düzenli tutulmasına yardımcı olur.

### Evrak & Plan

Okul içinde sık hazırlanan belge ve plan akışlarını daha hızlı üretmeye odaklanan modüldür. Belge akışları, öğretmenin küçük adımlarla veri girmesi ve resmi görünümlü çıktıya ulaşması prensibiyle geliştirilir.

## Mevcut Durum

BiSinif aktif olarak gelişen bir projedir. Bazı modüller daha oturmuş durumdayken bazı akışlar hâlâ kontrollü biçimde genişletilmektedir.

Şu anki genel durum:

- Sınav analizi tarafında temel değerlendirme ve raporlama akışları bulunur.
- Sınıf yönetimi, öğrenci ve sınıf bağlamını düzenlemek için ana yapı taşlarından biridir.
- Evrak & Plan modülünde çalışan belge akışları vardır ve yeni belge türleri kademeli olarak eklenmektedir.
- Ürün, modülleri birbirinden izole tutarak büyütülmektedir.

## Neyi Çözmeye Çalışır?

BiSinif şu öğretmen problemlerini azaltmaya odaklanır:

- Farklı işler için dağınık araçlar kullanmak
- Aynı öğrenci, sınıf veya okul bilgisini tekrar tekrar girmek
- Belge hazırlarken zaman kaybetmek
- Sınav ve kazanım değerlendirmelerini manuel takip etmek
- Sınıf süreçlerinde pratik yönetim eksikliği yaşamak
- Resmi çıktı üretirken format ve düzenle uğraşmak

## Kurulum

### Gereksinimler

- Node.js
- npm

### Yerel Geliştirme

Bağımlılıkları yükleyin:

```bash
npm install
```

Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Varsayılan geliştirme adresi:

```text
http://localhost:5173
```

Production build almak için:

```bash
npm run build
```

Build çıktısını yerelde önizlemek için:

```bash
npm run preview
```

## Proje Yapısı

Proje React ve Vite tabanlıdır. Yapı modüler olarak büyütülmektedir.

Öne çıkan dizinler:

- `src/modules/ExamAnalysis`: sınav analizi modülü
- `src/modules/ClassManagement`: sınıf yönetimi modülü
- `src/modules/Docs`: evrak ve plan akışları
- `src/components`: ortak arayüz bileşenleri
- `src/core`: ortak çekirdek yardımcılar ve iş mantıkları
- `src/storage`: depolama erişimleri

Modüller mümkün olduğunca kendi sınırları içinde geliştirilir. Bu, çalışan bir alanı bozarak başka bir alanı büyütme riskini azaltır.

## Geliştirme Yaklaşımı

BiSinif'te geliştirme küçük ve kontrollü adımlarla ilerler:

- Çalışan modülü bozmadan geliştirme yapmak
- Modül izolasyonunu korumak
- Önce kullanılabilir akışı kurmak, sonra iyileştirmek
- Yerel ortamda hızlı deneme ve doğrulama yapmak
- Öğretmen için düşük sürtünmeli kararlar almak
- Geniş refaktörlerden kaçınarak ürün yüzeyini güvenli büyütmek

Bu yaklaşım, projenin aynı anda hem ürün olarak kullanılabilir kalmasını hem de yeni okul iş akışlarına açılmasını sağlar.

## Yol Haritası

Kısa ve orta vadeli yön:

- Mevcut ana modülleri daha sağlam hale getirmek
- Evrak & Plan tarafındaki belge akışlarını kontrollü biçimde genişletmek
- Sınav ve sınıf süreçleri arasındaki pratik bağlantıları güçlendirmek
- Daha fazla okul içi işi tek panelde yönetilebilir hale getirmek
- Öğretmen deneyimini daha hızlı, sade ve düşük sürtünmeli yapmak

## Not

BiSinif hâlâ aktif olarak gelişmektedir. README, projenin mevcut yönünü ve ürün çerçevesini anlatır; modüller ve iş akışları zaman içinde olgunlaşmaya devam edecektir.
