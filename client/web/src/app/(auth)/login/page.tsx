"use client"
import * as React from "react";
import { Input } from "@/components/ui/input";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";

import LoginWithGoogleImage from '../../../../public/icons8-google-48.png';

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from '@/store/auth';

const schema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

type FormFields = z.infer<typeof schema>

const SignupForm: React.FC = () => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    } }
    = useForm<FormFields>({ resolver: zodResolver(schema) });

  const API_URL = "http://localhost:3000";

  const { login } = useAuthStore()

  const mutation = useMutation({

    mutationFn: async (data: FormFields) => {
      return axios.post(`${API_URL}/user/signin`, {
        email: data.email,
        password: data.password
      })
    },

    onSuccess: (response) => {
      const { token } = response.data;
      const user = {
        id: response.data.sub,
        username: response.data.name,
        email: response.data.email
      };
      login(token, user);
      console.log("Signup successful, token stored", user);
      router.push('/');
    },
    onError: (error: any) => {
      console.error('Signin failed ', error.message);
    }
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <div className="px-10 pt-12 pb-10 mt-5 mb-4 max-w-full rounded-2xl bg-slate-50 w-[490px] max-md:px-5">
      <form
        onSubmit={handleSubmit(onSubmit)}

        className="flex flex-col ">
        <h1 className="text-4xl font-semibold text-neutral-600 text-center">
          Signup
          <br />
        </h1>

        {/* Email */}
        <div className=" flex flex-col mt-4  ">

          {
            errors.email ? (
              <span className="text-red-500">{errors.email.message}</span>
            ) : (

              <span className=" text-neutral-800  ">Email</span>
            )
          }
          <Input

            {...register("email")}
            className="text-md "
            type="email" placeholder="Enter your email" />
          <div className=" h-px border border-solid bg-neutral-400 border-neutral-400" />
        </div>

        {/* Password */}
        <div className=" flex flex-col mt-4  ">
          {
            errors.password ? (
              <span className=" text-red-500">{errors.password?.message}</span>
            ) : (
              <span className=" text-neutral-800  ">Password</span>
            )
          }
          <Input
            {...register("password")}
            className="text-md "
            type="password" placeholder="Enter a password" />
          <div className=" h-px border border-solid bg-neutral-400 border-neutral-400" />

        </div>

        <button
          type="submit"
          className="justify-center items-center px-16 py-5 mt-10 text-xl whitespace-nowrap rounded-[100px] text-white text-opacity-80 max-md:px-5 max-md:mt-10 bg-gradient-to-r from-blue-700 to bg-purple-600"
          disabled={isSubmitting}
        >
          {
            isSubmitting ? (
              <span>Loading...</span>
            ) : (
              <span>
                LOGIN
              </span>
            )
          }
        </button>
      </form >
      <Divider />
      <div className=" w-full flex justify-center ">
        <Image
          alt="Login with Google"
          src={LoginWithGoogleImage}
        />
      </div>
      <div className="flex gap-1.5 self-center mt-7 text-[1.2rem]">
        <div className="text-neutral-500">
          Don't have an account?
        </div>
        <a href="/signup" className="text-purple-500">
          Signup
        </a>
      </div>
    </div >
  );
};

const Divider: React.FC = () => {
  return (
    <div className="flex gap-2 mt-7 text-xl text-black whitespace-nowrap max-md:mt-10 ml-3">
      <div className="flex gap-1">
        <div className="shrink-0 my-auto h-0.5 border border-solid bg-neutral-400 border-neutral-400 w-[175px]" />
        <div>OR</div>
      </div>
      <div className="shrink-0 my-auto h-0.5 border border-solid bg-neutral-400 border-neutral-400 w-[175px]" />
    </div>
  );
};

const MyComponent: React.FC = () => {
  return (
    <div className="flex flex-col justify-center text-base bg-gradient-to-tr to-[#A348DF] from-[#7143E2] h-screen ">
      <div className="flex justify-center items-center px-16 py-20 w-full max-md:px-5 max-md:max-w-full">
        <div className="flex flex-col">
          <SignupForm />
        </div>
      </div>
    </div>
  );
};

export default MyComponent;
