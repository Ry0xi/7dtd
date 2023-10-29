# MODの導入方法

## Darkness Falls

- Alpha 21でMODを利用したいため、GitHubからはダウンロードできない
- MODのDiscordチャンネルで告知されている`Alpha 21.1用`のMODファイルをインストールする
- ゲームサーバーと各自のPCにMODをインストールする必要がある

### ゲームサーバーへのインストール手順

1. MODのZIPファイルをゲームサーバーからダウンロード
1. ZIPファイルを展開し、`/mnt/game/ServerFiles/Mods`ディレクトリに展開する
1. Darkness FallsのMAPをコピーする
1. サーバー設定ファイル(`/mnt/game/ServerFiles/sdtdserver.xml`)を編集

### MODのZIPファイルをゲームサーバーからダウンロード

Google Driveからダウンロードする際に工夫が必要。

参考: https://qiita.com/tanaike/items/f609a29ccb8d764d74b3

ダウンロード先は`/mnt`でないとストレージが足りずエラーになる。

```sh
fileid="" # Google DriveのファイルID

html=`curl -c ./cookie -s -L "https://drive.google.com/uc?export=download&id=${fileid}"`

curl -Lb ./cookie "https://drive.google.com/uc?export=download&`echo ${html}|grep -Po '(confirm=[a-zA-Z0-9\-_]+)'`&id=${fileid}" -o /mnt/game/ServerFiles/tmp/df-mod.zip
```

### ZIPファイルを展開し、`/mnt/game/ServerFiles/Mods`ディレクトリに展開する

ZIPファイルを展開

展開先は`/mnt`でないとストレージが足りずエラーになる。

```sh
# /mnt/game/ServerFiles/tmp/df-mod/Mods/* がMODファイル
unzip -d /mnt/game/ServerFiles/tmp/df-mod /mnt/game/ServerFiles/tmp/df-mod.zip

# ダウンロードしたMODファイルを移動して反映
mv /mnt/game/ServerFiles/tmp/df-mod/Mods/* /mnt/game/ServerFiles/Mods/

# Darkness Fallsのデフォルト設定をコピー
cp /mnt/game/ServerFiles/Mods/DarknessFallsServerConfig.xml /mnt/game/ServerFiles/sdtdserver.xml

# ディレクトリを削除
rm -rf /mnt/game/ServerFiles/tmp/df-mod

# ZIPファイルを削除
rm -f /mnt/game/ServerFiles/tmp/df-mod.zip
```

### Darkness FallsのMAPをコピーする

```sh
\cp -r /mnt/game/ServerFiles/Mods/0-DarknessFallsCore/Worlds/* /mnt/game/ServerFiles/Data/Worlds/
```

### サーバー設定ファイル(`/mnt/game/ServerFiles/sdtdserver.xml`)を編集

ゲームワールド設定を編集

```sh
sed -i '/.*GameWorld.*/ s/DFalls-Navezgane/RWG/' /mnt/game/ServerFiles/sdtdserver.xml

sed -i '/.*WorldGenSeed.*/ s/asdf/SdtdPVE02-MOD/' /mnt/game/ServerFiles/sdtdserver.xml

sed -i '/.*WorldGenSize.*/ s/6144/8192/' /mnt/game/ServerFiles/sdtdserver.xml

sed -i '/.*GameName.*/ s/My Game/SdtdPVE02-MOD/' /mnt/game/ServerFiles/sdtdserver.xml

sed -i '/.*ServerName.*/ s/My Game/SdtdPVE02-MOD/' /mnt/game/ServerFiles/sdtdserver.xml

```

フォルダーの指定を削除

```sh
sed -i '/UserDataFolder/s/\(^.*$\)//' /mnt/game/ServerFiles/sdtdserver.xml

sed -i '/SaveGameFolder/s/\(^.*$\)//' /mnt/game/ServerFiles/sdtdserver.xml
```

EACをOFFにする

```sh
sed -i '/.*EACEnabled.*/ s/true/false/' /mnt/game/ServerFiles/sdtdserver.xml
```

## Darkness Falls日本語化MOD

- ゲームサーバーにはインストールせず、各自のPCにインストール（必須ではない）
- [こちら](https://hapirouinfo.jp/7days-to-die-darkness-falls-installation/)からインストールする
