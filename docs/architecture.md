# Architecture

## Vue d ensemble

~~~
[Frontend Next.js] --HTTPS/JWT--> [Backend FastAPI]
                                     |
                                     |-- services/ai
                                     |-- services/ingestion
                                     |-- services/generation
                                     |-- services/payment
                                     |-- services/storage
                                     |
                                     |-- Supabase (DB + Auth + Storage)
                                     |-- Upstash Redis (cache)
                                     |-- Brevo (emails)
~~~

## Modules isoles

Chaque service est independant. Une defaillance dans l un n affecte pas les autres.
L orchestrateur IA applique un fallback en cascade + circuit breaker.
