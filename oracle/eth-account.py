#!/usr/bin/env python3
import codecs
import ecdsa
from Crypto.Hash import keccak
import os

private_key_bytes = os.urandom(32)

key = ecdsa.SigningKey.from_string(private_key_bytes, curve=ecdsa.SECP256k1).verifying_key

key_bytes = key.to_string()
private_key = codecs.encode(private_key_bytes, 'hex')
public_key = codecs.encode(key_bytes, 'hex')

print("Private key: ",private_key)
print("Public key: ",public_key)


public_key_bytes = codecs.decode(public_key, 'hex')

hash = keccak.new(digest_bits=256)
hash.update(public_key_bytes)
keccak_digest = hash.hexdigest()

address = '0x' + keccak_digest[-40:]
print("Address:",address)
